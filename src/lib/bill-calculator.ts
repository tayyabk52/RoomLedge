/**
 * Advanced Bill Calculator for RoomLedger
 * Handles itemized bills, uneven settlements, and complex payment scenarios
 * with 100% mathematical accuracy using paisa-precision calculations
 */

import { Paisa, paisaUtils } from './paisa-utils';
import { HamiltonRounder, ProportionalTarget } from './hamilton-rounding';

// Core data structures
export interface BillItem {
  userId: string;
  itemName: string;
  pricePaisa: Paisa;
  quantity: number;
}

export interface BillExtra {
  type: 'tax' | 'service' | 'tip' | 'delivery' | 'other';
  name: string;
  amountPaisa: Paisa;
  splitRule: 'proportional' | 'flat' | 'payer_only';
}

export type CoverageType = 'proportional' | 'self_first' | 'specific' | 'custom'

export interface BillPayer {
  userId: string;
  amountPaidPaisa: Paisa;
  coverageType?: CoverageType; // How to distribute this payment (default: proportional)
  coverageTargets?: string[]; // If specified, this payer only covers these users
  coverageWeights?: Map<string, number>; // Custom weights for coverage
}

export interface UserBalance {
  userId: string;
  owedPaisa: Paisa;           // What they should pay (items + fair share of extras)
  coveredPaisa: Paisa;        // What was paid for them at counter
  netPaisa: Paisa;           // covered - owed (positive = they're owed money)
  remainingPaisa: Paisa;     // net + settlements received - settlements paid
}

export interface MinimalTransfer {
  fromUserId: string;
  toUserId: string;
  amountPaisa: Paisa;
}

export interface BillCalculationResult {
  userBalances: Map<string, UserBalance>;
  suggestedTransfers: MinimalTransfer[];
  totalItemsPaisa: Paisa;
  totalExtrasPaisa: Paisa;
  totalBillPaisa: Paisa;
  totalPaidPaisa: Paisa;
  isBalanced: boolean;
  validationErrors: string[];
}

export interface BillCalculationInput {
  items: BillItem[];
  extras: BillExtra[];
  payers: BillPayer[];
  participants: string[]; // All users involved in the bill
  settlements?: Array<{
    fromUserId: string;
    toUserId: string;
    amountPaisa: Paisa;
  }>;
}

/**
 * Advanced Bill Calculator
 */
export class BillCalculator {
  /**
   * Calculate complete bill breakdown with mathematical accuracy guarantees
   */
  static calculate(input: BillCalculationInput): BillCalculationResult {
    const validationErrors = this.validateInput(input);

    if (validationErrors.length > 0) {
      throw new Error(`Bill calculation validation failed: ${validationErrors.join(', ')}`);
    }

    // Step 1: Calculate what each user owes (items + fair share of extras)
    const owedAmounts = this.calculateOwedAmounts(input.items, input.extras, input.participants);

    // Step 2: Calculate what was covered for each user at the counter
    const coveredAmounts = this.calculateCoveredAmounts(input.payers, input.participants);

    // Step 3: Calculate net balances (covered - owed)
    const netBalances = this.calculateNetBalances(owedAmounts, coveredAmounts);

    // Step 4: Apply settlements to get remaining balances
    const remainingBalances = this.applySettlements(netBalances, input.settlements || []);

    // Step 5: Generate minimal transfer suggestions
    const suggestedTransfers = this.generateMinimalTransfers(remainingBalances);

    // Step 6: Calculate totals and validate
    const totalItemsPaisa = paisaUtils.sum(
      input.items.map(item => paisaUtils.multiply(item.pricePaisa, item.quantity))
    );
    const totalExtrasPaisa = paisaUtils.sum(input.extras.map(extra => extra.amountPaisa));
    const totalBillPaisa = paisaUtils.add(totalItemsPaisa, totalExtrasPaisa);
    const totalPaidPaisa = paisaUtils.sum(input.payers.map(payer => payer.amountPaidPaisa));

    // Create user balances
    const userBalances = new Map<string, UserBalance>();
    for (const userId of input.participants) {
      userBalances.set(userId, {
        userId,
        owedPaisa: owedAmounts.get(userId) || 0,
        coveredPaisa: coveredAmounts.get(userId) || 0,
        netPaisa: netBalances.get(userId) || 0,
        remainingPaisa: remainingBalances.get(userId) || 0
      });
    }

    // Validate mathematical accuracy
    const finalValidationErrors = this.validateCalculationResult({
      userBalances,
      totalBillPaisa,
      totalPaidPaisa,
      suggestedTransfers
    });

    return {
      userBalances,
      suggestedTransfers,
      totalItemsPaisa,
      totalExtrasPaisa,
      totalBillPaisa,
      totalPaidPaisa,
      isBalanced: totalBillPaisa === totalPaidPaisa && finalValidationErrors.length === 0,
      validationErrors: finalValidationErrors
    };
  }

  /**
   * Calculate what each user owes (items + proportional share of extras)
   */
  private static calculateOwedAmounts(
    items: BillItem[],
    extras: BillExtra[],
    participants: string[]
  ): Map<string, Paisa> {
    const owedAmounts = new Map<string, Paisa>();

    // Initialize all participants with 0
    participants.forEach(userId => owedAmounts.set(userId, 0));

    // Add item costs per user
    for (const item of items) {
      const itemTotal = paisaUtils.multiply(item.pricePaisa, item.quantity);
      const currentOwed = owedAmounts.get(item.userId) || 0;
      owedAmounts.set(item.userId, paisaUtils.add(currentOwed, itemTotal));
    }

    // Get base amounts for proportional extras calculation
    const baseAmounts = new Map(owedAmounts);

    // Distribute extras using Hamilton rounding
    for (const extra of extras) {
      const extrasDistribution = HamiltonRounder.distributeExtras(
        extra.amountPaisa,
        baseAmounts,
        extra.splitRule,
        extra.splitRule === 'payer_only' ? participants : undefined // For simplicity, all participants are potential payers
      );

      // Add extra shares to owed amounts
      for (const [userId, extraShare] of extrasDistribution.userAllocations!) {
        const currentOwed = owedAmounts.get(userId) || 0;
        owedAmounts.set(userId, paisaUtils.add(currentOwed, extraShare));
      }
    }

    return owedAmounts;
  }

  /**
   * Calculate total payments made by each user (paid_by[user])
   * This represents how much each person contributed to the cashier, not debt coverage
   */
  private static calculateCoveredAmounts(
    payers: BillPayer[],
    participants: string[]
  ): Map<string, Paisa> {
    const coveredAmounts = new Map<string, Paisa>();

    // Initialize all participants with 0 (they paid nothing by default)
    participants.forEach(userId => coveredAmounts.set(userId, 0));

    // Each payer gets credit for their total payment amount
    // This represents paid_by[user] in the formula: net[user] = paid_by[user] - owed[user]
    for (const payer of payers) {
      const currentCovered = coveredAmounts.get(payer.userId) || 0;
      coveredAmounts.set(payer.userId, paisaUtils.add(currentCovered, payer.amountPaidPaisa));
    }

    return coveredAmounts;
  }

  /**
   * Calculate net balances (covered - owed)
   */
  private static calculateNetBalances(
    owedAmounts: Map<string, Paisa>,
    coveredAmounts: Map<string, Paisa>
  ): Map<string, Paisa> {
    const netBalances = new Map<string, Paisa>();

    const allUserIds = new Set([...owedAmounts.keys(), ...coveredAmounts.keys()]);

    for (const userId of allUserIds) {
      const owed = owedAmounts.get(userId) || 0;
      const covered = coveredAmounts.get(userId) || 0;
      netBalances.set(userId, paisaUtils.subtract(covered, owed));
    }

    return netBalances;
  }

  /**
   * Apply settlements to net balances to get remaining balances
   */
  private static applySettlements(
    netBalances: Map<string, Paisa>,
    settlements: Array<{ fromUserId: string; toUserId: string; amountPaisa: Paisa }>
  ): Map<string, Paisa> {
    const remainingBalances = new Map(netBalances);

    for (const settlement of settlements) {
      // Deduct from payer
      const fromBalance = remainingBalances.get(settlement.fromUserId) || 0;
      remainingBalances.set(
        settlement.fromUserId,
        paisaUtils.subtract(fromBalance, settlement.amountPaisa)
      );

      // Add to receiver
      const toBalance = remainingBalances.get(settlement.toUserId) || 0;
      remainingBalances.set(
        settlement.toUserId,
        paisaUtils.add(toBalance, settlement.amountPaisa)
      );
    }

    return remainingBalances;
  }

  /**
   * Generate minimal cash flow transfers using greedy algorithm
   */
  private static generateMinimalTransfers(
    remainingBalances: Map<string, Paisa>
  ): MinimalTransfer[] {
    const transfers: MinimalTransfer[] = [];

    // Create debtors (owe money) and creditors (are owed money) lists
    const debtors: Array<{ userId: string; amount: Paisa }> = [];
    const creditors: Array<{ userId: string; amount: Paisa }> = [];

    for (const [userId, balance] of remainingBalances) {
      if (balance < -100) { // Owes more than 1 PKR
        debtors.push({ userId, amount: paisaUtils.abs(balance) });
      } else if (balance > 100) { // Owed more than 1 PKR
        creditors.push({ userId, amount: balance });
      }
    }

    // Sort for consistent results
    debtors.sort((a, b) => b.amount - a.amount || a.userId.localeCompare(b.userId));
    creditors.sort((a, b) => b.amount - a.amount || a.userId.localeCompare(b.userId));

    // Greedy matching algorithm
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];

      const transferAmount = Math.min(debtor.amount, creditor.amount);

      if (transferAmount > 100) { // Only create transfers > 1 PKR
        transfers.push({
          fromUserId: debtor.userId,
          toUserId: creditor.userId,
          amountPaisa: transferAmount
        });
      }

      // Update remaining amounts
      debtor.amount -= transferAmount;
      creditor.amount -= transferAmount;

      // Move to next debtor/creditor if current one is settled
      if (debtor.amount <= 100) debtorIndex++;
      if (creditor.amount <= 100) creditorIndex++;
    }

    return transfers;
  }

  /**
   * Validate input data
   */
  private static validateInput(input: BillCalculationInput): string[] {
    const errors: string[] = [];

    // Validate participants
    if (input.participants.length === 0) {
      errors.push('No participants provided');
    }

    // Validate items
    for (const item of input.items) {
      if (!paisaUtils.isPositivePaisa(item.pricePaisa)) {
        errors.push(`Invalid item price: ${item.itemName} - ${item.pricePaisa}`);
      }
      if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        errors.push(`Invalid item quantity: ${item.itemName} - ${item.quantity}`);
      }
      if (!input.participants.includes(item.userId)) {
        errors.push(`Item user not in participants: ${item.userId}`);
      }
    }

    // Validate extras
    for (const extra of input.extras) {
      if (!paisaUtils.isValidPaisa(extra.amountPaisa)) {
        errors.push(`Invalid extra amount: ${extra.name} - ${extra.amountPaisa}`);
      }
    }

    // Validate payers
    for (const payer of input.payers) {
      if (!paisaUtils.isPositivePaisa(payer.amountPaidPaisa)) {
        errors.push(`Invalid payer amount: ${payer.userId} - ${payer.amountPaidPaisa}`);
      }
      if (!input.participants.includes(payer.userId)) {
        errors.push(`Payer not in participants: ${payer.userId}`);
      }
    }

    return errors;
  }

  /**
   * Validate final calculation result
   */
  private static validateCalculationResult(result: {
    userBalances: Map<string, UserBalance>;
    totalBillPaisa: Paisa;
    totalPaidPaisa: Paisa;
    suggestedTransfers: MinimalTransfer[];
  }): string[] {
    const errors: string[] = [];

    // AC-1: Check that total owed equals bill total
    const totalOwed = paisaUtils.sum(
      Array.from(result.userBalances.values()).map(b => b.owedPaisa)
    );
    if (totalOwed !== result.totalBillPaisa) {
      errors.push(`AC-1 violation: Total owed (${totalOwed}) != Bill total (${result.totalBillPaisa})`);
    }

    // AC-2: Check that total covered equals total paid
    const totalCovered = paisaUtils.sum(
      Array.from(result.userBalances.values()).map(b => b.coveredPaisa)
    );
    if (totalCovered !== result.totalPaidPaisa) {
      errors.push(`AC-2 violation: Total covered (${totalCovered}) != Total paid (${result.totalPaidPaisa})`);
    }

    // AC-3: Check that remaining balances sum to zero
    const totalRemaining = Array.from(result.userBalances.values())
      .reduce((sum, b) => sum + b.remainingPaisa, 0);
    if (Math.abs(totalRemaining) > 100) { // Allow 1 PKR tolerance for rounding
      errors.push(`AC-3 violation: Total remaining balances (${totalRemaining}) != 0`);
    }

    return errors;
  }

  /**
   * Check if bill is settled (all remaining balances within tolerance)
   */
  static isBillSettled(userBalances: Map<string, UserBalance>): boolean {
    return Array.from(userBalances.values()).every(
      balance => paisaUtils.isWithinTolerance(balance.remainingPaisa, 100)
    );
  }

  /**
   * Clamp settlement amount to prevent over-settlement
   */
  static clampSettlementAmount(
    fromUserId: string,
    toUserId: string,
    requestedAmount: Paisa,
    userBalances: Map<string, UserBalance>
  ): { clampedAmount: Paisa; isValid: boolean; reason?: string } {
    const fromBalance = userBalances.get(fromUserId);
    const toBalance = userBalances.get(toUserId);

    if (!fromBalance || !toBalance) {
      return { clampedAmount: 0, isValid: false, reason: 'User not found in balances' };
    }

    // Debtor (negative remaining) can't pay more than they owe
    const maxFromCanPay = fromBalance.remainingPaisa < 0 ? paisaUtils.abs(fromBalance.remainingPaisa) : 0;

    // Creditor (positive remaining) can't receive more than they're owed
    const maxToCanReceive = toBalance.remainingPaisa > 0 ? toBalance.remainingPaisa : 0;

    // Clamp to the minimum of what can be paid/received
    const maxAllowed = Math.min(maxFromCanPay, maxToCanReceive, requestedAmount);

    if (maxAllowed <= 0) {
      return { clampedAmount: 0, isValid: false, reason: 'No settlement needed between these users' };
    }

    if (maxAllowed < requestedAmount) {
      return {
        clampedAmount: maxAllowed,
        isValid: true,
        reason: `Amount clamped from ${paisaUtils.formatPKR(requestedAmount)} to ${paisaUtils.formatPKR(maxAllowed)}`
      };
    }

    return { clampedAmount: requestedAmount, isValid: true };
  }
}

export default BillCalculator;