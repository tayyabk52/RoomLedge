/**
 * Hamilton Rounding (Largest Remainder Method) for RoomLedger
 * Ensures exact distribution of fractional amounts with zero error
 */

import { Paisa, paisaUtils } from './paisa-utils';

export interface HamiltonDistributionResult {
  allocations: Paisa[];
  userAllocations?: Map<string, Paisa>;
  totalAllocated: Paisa;
  isExact: boolean;
}

export interface ProportionalTarget {
  userId: string;
  proportion: number; // Can be weight, amount owed, or any positive number
  name?: string; // For debugging/display
}

/**
 * Hamilton Rounding utility class
 */
export class HamiltonRounder {
  /**
   * Distribute amount using Hamilton method (Largest Remainder)
   * Guarantees that sum of allocations equals exactly the total amount
   */
  static distribute(
    totalAmount: Paisa,
    targets: ProportionalTarget[]
  ): HamiltonDistributionResult {
    if (!paisaUtils.isValidPaisa(totalAmount) || totalAmount < 0) {
      throw new Error(`Invalid total amount: ${totalAmount}`);
    }

    if (targets.length === 0) {
      throw new Error('No targets provided for distribution');
    }

    // Validate all proportions are non-negative
    for (const target of targets) {
      if (target.proportion < 0) {
        throw new Error(`Negative proportion not allowed: ${target.proportion} for ${target.userId}`);
      }
    }

    const totalProportion = targets.reduce((sum, t) => sum + t.proportion, 0);

    // Handle edge cases
    if (totalProportion === 0) {
      // All proportions are zero - distribute evenly
      return this.distributeEvenly(totalAmount, targets.map(t => t.userId));
    }

    if (totalAmount === 0) {
      // Nothing to distribute
      const allocations = new Array(targets.length).fill(0);
      const userAllocations = new Map(targets.map((t, i) => [t.userId, allocations[i]]));
      return {
        allocations,
        userAllocations,
        totalAllocated: 0,
        isExact: true
      };
    }

    // Calculate exact amounts (may have fractions)
    const exactAmounts = targets.map(target =>
      (totalAmount * target.proportion) / totalProportion
    );

    // Get integer parts and decimal remainders
    const integerParts = exactAmounts.map(amount => Math.floor(amount));
    const remainders = exactAmounts.map((amount, index) => ({
      remainder: amount - integerParts[index],
      index,
      userId: targets[index].userId
    }));

    // Start with integer allocations
    const allocations = [...integerParts];

    // Calculate shortfall (due to rounding down)
    const allocatedSoFar = paisaUtils.sum(integerParts);
    const shortfall = totalAmount - allocatedSoFar;

    // Distribute the shortfall using largest remainder method
    if (shortfall > 0) {
      // Sort by remainder (descending), with stable tie-breaking by index
      remainders.sort((a, b) => {
        if (Math.abs(a.remainder - b.remainder) < Number.EPSILON) {
          // Tie-breaking: prefer earlier index for deterministic results
          return a.index - b.index;
        }
        return b.remainder - a.remainder;
      });

      // Give 1 extra paisa to the 'shortfall' targets with largest remainders
      for (let i = 0; i < shortfall && i < remainders.length; i++) {
        allocations[remainders[i].index] += 1;
      }
    }

    // Create user mapping
    const userAllocations = new Map(
      targets.map((target, index) => [target.userId, allocations[index]])
    );

    // Verify exactness
    const totalAllocated = paisaUtils.sum(allocations);
    const isExact = totalAllocated === totalAmount;

    if (!isExact) {
      throw new Error(
        `Hamilton rounding failed: allocated ${totalAllocated}, expected ${totalAmount}`
      );
    }

    return {
      allocations,
      userAllocations,
      totalAllocated,
      isExact
    };
  }

  /**
   * Distribute amount evenly among users (fallback for zero proportions)
   */
  static distributeEvenly(
    totalAmount: Paisa,
    userIds: string[]
  ): HamiltonDistributionResult {
    if (userIds.length === 0) {
      throw new Error('No users provided for even distribution');
    }

    const targets = userIds.map(userId => ({
      userId,
      proportion: 1 // Equal weight for everyone
    }));

    return this.distribute(totalAmount, targets);
  }

  /**
   * Distribute extras (tax, service, tip) proportionally based on base amounts
   */
  static distributeExtras(
    extrasAmount: Paisa,
    baseAmounts: Map<string, Paisa>,
    splitRule: 'proportional' | 'flat' | 'payer_only' = 'proportional',
    payerIds?: string[]
  ): HamiltonDistributionResult {
    const userIds = Array.from(baseAmounts.keys());

    switch (splitRule) {
      case 'proportional': {
        const targets = userIds.map(userId => ({
          userId,
          proportion: baseAmounts.get(userId) || 0
        }));
        return this.distribute(extrasAmount, targets);
      }

      case 'flat': {
        return this.distributeEvenly(extrasAmount, userIds);
      }

      case 'payer_only': {
        if (!payerIds || payerIds.length === 0) {
          throw new Error('Payer IDs required for payer_only split rule');
        }
        return this.distributeEvenly(extrasAmount, payerIds);
      }

      default:
        throw new Error(`Unknown split rule: ${splitRule}`);
    }
  }

  /**
   * Validate that a distribution result is mathematically correct
   */
  static validateDistribution(
    result: HamiltonDistributionResult,
    expectedTotal: Paisa
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if total matches
    if (result.totalAllocated !== expectedTotal) {
      errors.push(`Total mismatch: got ${result.totalAllocated}, expected ${expectedTotal}`);
    }

    // Check if all allocations are non-negative integers
    for (let i = 0; i < result.allocations.length; i++) {
      const allocation = result.allocations[i];
      if (!paisaUtils.isValidPaisa(allocation)) {
        errors.push(`Invalid allocation at index ${i}: ${allocation}`);
      }
    }

    // Check if user allocations map is consistent with array
    if (result.userAllocations) {
      const mapTotal = paisaUtils.sum(Array.from(result.userAllocations.values()));
      if (mapTotal !== result.totalAllocated) {
        errors.push(`User allocations map inconsistent: ${mapTotal} vs ${result.totalAllocated}`);
      }
    }

    // Check exactness flag
    if (!result.isExact && errors.length === 0) {
      errors.push('Distribution marked as inexact but no errors found');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a detailed breakdown for debugging/display
   */
  static createBreakdown(
    totalAmount: Paisa,
    targets: ProportionalTarget[],
    result: HamiltonDistributionResult
  ): Array<{
    userId: string;
    name?: string;
    proportion: number;
    proportionPercentage: number;
    exactAmount: number;
    allocatedPaisa: Paisa;
    allocatedPKR: number;
    roundingAdjustment: Paisa;
  }> {
    const totalProportion = targets.reduce((sum, t) => sum + t.proportion, 0);

    return targets.map((target, index) => {
      const proportionPercentage = totalProportion > 0
        ? (target.proportion / totalProportion) * 100
        : 100 / targets.length;

      const exactAmount = totalProportion > 0
        ? (totalAmount * target.proportion) / totalProportion
        : totalAmount / targets.length;

      const allocatedPaisa = result.allocations[index];
      const roundingAdjustment = allocatedPaisa - Math.floor(exactAmount);

      return {
        userId: target.userId,
        name: target.name,
        proportion: target.proportion,
        proportionPercentage,
        exactAmount,
        allocatedPaisa,
        allocatedPKR: paisaUtils.toPKR(allocatedPaisa),
        roundingAdjustment
      };
    });
  }
}

// Convenience functions for common use cases
export const hamiltonUtils = {
  /**
   * Split tax proportionally among participants based on their bill amounts
   */
  splitTaxProportionally: (
    taxAmount: Paisa,
    userBaseAmounts: Map<string, Paisa>
  ): Map<string, Paisa> => {
    const targets: ProportionalTarget[] = Array.from(userBaseAmounts.entries())
      .map(([userId, amount]) => ({ userId, proportion: amount }));

    const result = HamiltonRounder.distribute(taxAmount, targets);
    return result.userAllocations!;
  },

  /**
   * Split service charge evenly among all participants
   */
  splitServiceEvenly: (
    serviceAmount: Paisa,
    participantIds: string[]
  ): Map<string, Paisa> => {
    const result = HamiltonRounder.distributeEvenly(serviceAmount, participantIds);
    return result.userAllocations!;
  },

  /**
   * Assign tip only to payers
   */
  assignTipToPayers: (
    tipAmount: Paisa,
    payerIds: string[]
  ): Map<string, Paisa> => {
    const result = HamiltonRounder.distributeEvenly(tipAmount, payerIds);
    return result.userAllocations!;
  }
};

export default HamiltonRounder;