/**
 * Paisa-precision utilities for RoomLedger Advanced Bills
 * All monetary calculations are done in paisa (PKR * 100) to avoid floating point errors
 */

// Type definitions for paisa calculations
export type Paisa = number; // Always integers representing paisa (1 PKR = 100 paisa)
export type PKR = number;   // Display amounts in PKR

// Conversion utilities
export const paisaUtils = {
  /**
   * Convert PKR to paisa (multiply by 100)
   */
  fromPKR: (pkr: PKR): Paisa => Math.round(pkr * 100),

  /**
   * Convert paisa to PKR (divide by 100)
   */
  toPKR: (paisa: Paisa): PKR => paisa / 100,

  /**
   * Format paisa as PKR string with proper decimal places
   */
  formatPKR: (paisa: Paisa, showSign = false): string => {
    const pkr = paisa / 100;
    const sign = showSign && paisa !== 0 ? (paisa > 0 ? '+' : '') : '';
    return `${sign}₨${Math.abs(pkr).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  },

  /**
   * Validate that a number represents valid paisa (non-negative integer)
   */
  isValidPaisa: (value: number): boolean => {
    return Number.isInteger(value) && value >= 0;
  },

  /**
   * Validate that a paisa amount is positive
   */
  isPositivePaisa: (value: number): boolean => {
    return Number.isInteger(value) && value > 0;
  },

  /**
   * Safe addition of paisa amounts
   */
  add: (...amounts: Paisa[]): Paisa => {
    return amounts.reduce((sum, amount) => {
      if (!paisaUtils.isValidPaisa(amount)) {
        throw new Error(`Invalid paisa amount: ${amount}`);
      }
      return sum + amount;
    }, 0);
  },

  /**
   * Safe subtraction of paisa amounts
   */
  subtract: (a: Paisa, b: Paisa): Paisa => {
    if (!paisaUtils.isValidPaisa(a) || !paisaUtils.isValidPaisa(b)) {
      throw new Error(`Invalid paisa amounts: ${a}, ${b}`);
    }
    return a - b;
  },

  /**
   * Safe multiplication (for quantities)
   */
  multiply: (paisa: Paisa, multiplier: number): Paisa => {
    if (!paisaUtils.isValidPaisa(paisa) || !Number.isInteger(multiplier) || multiplier < 0) {
      throw new Error(`Invalid paisa multiplication: ${paisa} * ${multiplier}`);
    }
    return paisa * multiplier;
  },

  /**
   * Calculate percentage of an amount in paisa
   */
  percentage: (amount: Paisa, percent: number): Paisa => {
    if (!paisaUtils.isValidPaisa(amount) || percent < 0) {
      throw new Error(`Invalid percentage calculation: ${amount} * ${percent}%`);
    }
    return Math.round((amount * percent) / 100);
  },

  /**
   * Check if amount is within tolerance (for settlement checking)
   */
  isWithinTolerance: (amount: Paisa, tolerance: Paisa = 100): boolean => {
    return Math.abs(amount) <= tolerance;
  },

  /**
   * Round to nearest paisa (should already be integer, but safety check)
   */
  round: (value: number): Paisa => Math.round(value),

  /**
   * Get absolute value in paisa
   */
  abs: (paisa: Paisa): Paisa => Math.abs(paisa),

  /**
   * Compare two paisa amounts
   */
  compare: (a: Paisa, b: Paisa): number => {
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
  },

  /**
   * Find minimum paisa amount from array
   */
  min: (...amounts: Paisa[]): Paisa => Math.min(...amounts),

  /**
   * Find maximum paisa amount from array
   */
  max: (...amounts: Paisa[]): Paisa => Math.max(...amounts),

  /**
   * Sum array of paisa amounts
   */
  sum: (amounts: Paisa[]): Paisa => {
    return amounts.reduce((total, amount) => {
      if (!paisaUtils.isValidPaisa(amount)) {
        throw new Error(`Invalid paisa amount in array: ${amount}`);
      }
      return total + amount;
    }, 0);
  },

  /**
   * Validate that sum equals expected total (for accuracy checking)
   */
  validateSum: (amounts: Paisa[], expectedTotal: Paisa): boolean => {
    const actualTotal = paisaUtils.sum(amounts);
    return actualTotal === expectedTotal;
  },

  /**
   * Split amount evenly among participants using Hamilton method
   * Returns array where sum exactly equals the input amount
   */
  splitEvenly: (totalPaisa: Paisa, participants: number): Paisa[] => {
    if (!paisaUtils.isValidPaisa(totalPaisa) || participants <= 0) {
      throw new Error(`Invalid split parameters: ${totalPaisa} among ${participants}`);
    }

    const baseAmount = Math.floor(totalPaisa / participants);
    const remainder = totalPaisa % participants;

    const result = new Array(participants).fill(baseAmount);

    // Distribute remainder using Hamilton method (first 'remainder' people get +1)
    for (let i = 0; i < remainder; i++) {
      result[i] += 1;
    }

    return result;
  },

  /**
   * Calculate proportional split with Hamilton rounding
   */
  splitProportionally: (
    totalPaisa: Paisa,
    proportions: number[],
    userIds?: string[]
  ): { amounts: Paisa[]; userAmounts?: Map<string, Paisa> } => {
    if (!paisaUtils.isValidPaisa(totalPaisa) || proportions.length === 0) {
      throw new Error(`Invalid proportional split parameters`);
    }

    const totalProportion = proportions.reduce((sum, p) => sum + p, 0);
    if (totalProportion <= 0) {
      throw new Error(`Invalid total proportion: ${totalProportion}`);
    }

    // Calculate exact amounts (may have decimals)
    const exactAmounts = proportions.map(p => (totalPaisa * p) / totalProportion);

    // Get integer parts and remainders
    const integerParts = exactAmounts.map(a => Math.floor(a));
    const remainders = exactAmounts.map((a, i) => a - integerParts[i]);

    // Start with integer parts
    const result = [...integerParts];

    // Calculate how much we're short
    const allocatedTotal = paisaUtils.sum(integerParts);
    const shortfall = totalPaisa - allocatedTotal;

    // Hamilton method: give 1 extra paisa to participants with largest remainders
    if (shortfall > 0) {
      const indexedRemainders = remainders.map((remainder, index) => ({ remainder, index }));
      indexedRemainders.sort((a, b) => b.remainder - a.remainder || a.index - b.index); // Stable sort

      for (let i = 0; i < shortfall; i++) {
        result[indexedRemainders[i].index] += 1;
      }
    }

    // Create user mapping if userIds provided
    const userAmounts = userIds ? new Map(
      userIds.map((userId, index) => [userId, result[index]])
    ) : undefined;

    return { amounts: result, userAmounts };
  }
};

// Constants for common operations
export const PAISA_CONSTANTS = {
  ONE_PKR: 100,           // 1 PKR in paisa
  SETTLEMENT_TOLERANCE: 100, // 1 PKR tolerance for settlements
  MIN_SETTLEMENT: 500,    // Minimum 5 PKR for settlements to avoid micro-transactions
  MAX_PRECISION_PKR: 999999999.99, // Maximum supported PKR amount
} as const;

// Validation utilities
export const paisaValidation = {
  /**
   * Validate PKR input from user (reasonable limits)
   */
  isValidPKRInput: (pkr: number): boolean => {
    return (
      !isNaN(pkr) &&
      isFinite(pkr) &&
      pkr >= 0 &&
      pkr <= PAISA_CONSTANTS.MAX_PRECISION_PKR &&
      Number(pkr.toFixed(2)) === pkr // Ensure no more than 2 decimal places
    );
  },

  /**
   * Validate that bill totals make sense
   */
  isReasonableBillAmount: (paisa: Paisa): boolean => {
    return (
      paisaUtils.isPositivePaisa(paisa) &&
      paisa >= PAISA_CONSTANTS.ONE_PKR && // At least 1 PKR
      paisa <= paisaUtils.fromPKR(PAISA_CONSTANTS.MAX_PRECISION_PKR)
    );
  },

  /**
   * Validate settlement amount
   */
  isValidSettlementAmount: (paisa: Paisa): boolean => {
    return (
      paisaUtils.isPositivePaisa(paisa) &&
      paisa >= PAISA_CONSTANTS.MIN_SETTLEMENT
    );
  }
};

// Export convenience functions for common operations
export const toPaisa = paisaUtils.fromPKR;
export const toPKR = paisaUtils.toPKR;
export const formatPKR = paisaUtils.formatPKR;