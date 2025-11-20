/**
 * Expression operator input type, which can be a string, number, or EBExpr object.
 */
export type EBExprOperatorInput = string | number | EBExpr;

/**
 * EBExpr class, used to construct and manipulate expressions.
 */
export class EBExpr {
  protected optCout: number = 0; // Operator count
  protected expr: string = ""; // Expression string
  protected readonly: boolean = false; // Whether the expression is read-only

  /**
   * Constructor
   * @param v The initial value of the expression.
   * @param readonly Whether the expression is read-only. Defaults to false.
   */
  constructor(v: EBExprOperatorInput, readonly: boolean = false) {
    this.expr = this.preCheck(v);
    this.readonly = readonly;
  }

  /**
   * Pre-checks the expression input.
   * @param expr The expression input.
   * @returns The processed expression string.
   * @throws An error if the expression is read-only or the number of operators exceeds 6.
   */
  protected preCheck(expr: EBExprOperatorInput): string {
    if (this.readonly) {
      throw new Error("The value is readonly");
    }
    let result = expr;
    if (expr instanceof EBExpr) {
      this.optCout += expr.optCout;
      result = expr.getValue();
    } else {
      this.optCout++;
    }
    if (this.optCout > 6) {
      throw new Error("The number of operators should not be more than 6");
    }
    return `${result}`;
  }

  /**
   * Gets the value of the current expression.
   * @returns The expression string.
   */
  public getValue(): string {
    return this.expr;
  }

  /**
   * Multiplication operation.
   * @param num The multiplier.
   * @returns The current object (for chaining).
   */
  multiply(num: EBExprOperatorInput) {
    this.expr = `${this.expr},*${this.preCheck(num)}`;
    return this;
  }

  /**
   * Division operation.
   * @param num The divisor.
   * @returns The current object (for chaining).
   */
  divide(num: EBExprOperatorInput) {
    this.expr = `${this.expr},/${this.preCheck(num)}`;
    return this;
  }

  /**
   * Addition operation.
   * @param num The number to add.
   * @returns The current object (for chaining).
   */
  add(num: EBExprOperatorInput) {
    this.expr = `${this.expr},+${this.preCheck(num)}`;
    return this;
  }

  /**
   * Subtraction operation.
   * @param num The number to subtract.
   * @returns The current object (for chaining).
   */
  minus(num: EBExprOperatorInput) {
    this.expr = `${this.expr},-${this.preCheck(num)}`;
    return this;
  }

  /**
   * Bitwise AND operation.
   * @param num The operand.
   * @returns The current object (for chaining).
   */
  bitwiseAnd(num: EBExprOperatorInput) {
    this.expr = `${this.expr},&${this.preCheck(num)}`;
    return this;
  }

  /**
   * Power operation.
   * @param num The exponent.
   * @returns The current object (for chaining).
   */
  power(num: EBExprOperatorInput) {
    this.expr = `${this.expr},@${this.preCheck(num)}`;
    return this;
  }

  /**
   * Bitwise NOT operation.
   * @param num The operand.
   * @returns The current object (for chaining).
   */
  not(num: EBExprOperatorInput) {
    this.expr = `${this.expr},!${this.preCheck(num)}`;
    return this;
  }

  /**
   * Left shift operation.
   * @param num The number of bits to shift.
   * @returns The current object (for chaining).
   */
  leftShift(num: EBExprOperatorInput) {
    this.expr = `${this.expr},<<${this.preCheck(num)}`;
    return this;
  }

  /**
   * Right shift operation.
   * @param num The number of bits to shift.
   * @returns The current object (for chaining).
   */
  rightShift(num: EBExprOperatorInput) {
    this.expr = `${this.expr},>>${this.preCheck(num)}`;
    return this;
  }

  /**
   * Bitwise OR operation.
   * @param num The operand.
   * @returns The current object (for chaining).
   */
  bitwiseOr(num: EBExprOperatorInput) {
    this.expr = `${this.expr},|${this.preCheck(num)}`;
    return this;
  }

  /**
   * Not equal to operation.
   * @param num The operand.
   * @returns The current object (for chaining).
   */
  notEqual(num: EBExprOperatorInput) {
    this.expr = `${this.expr},!=${this.preCheck(num)}`;
    return this;
  }

  /**
   * Equal to operation.
   * @param num The operand.
   * @returns The current object (for chaining).
   */
  equal(num: EBExprOperatorInput) {
    this.expr = `${this.expr},==${this.preCheck(num)}`;
    return this;
  }

  /**
   * Less than operation.
   * @param num The operand.
   * @returns The current object (for chaining).
   */
  lessThan(num: EBExprOperatorInput) {
    this.expr = `${this.expr},<${this.preCheck(num)}`;
    return this;
  }

  /**
   * Greater than operation.
   * @param num The operand.
   * @returns The current object (for chaining).
   */
  greaterThan(num: EBExprOperatorInput) {
    this.expr = `${this.expr},>${this.preCheck(num)}`;
    return this;
  }

  /**
   * Modulo operation.
   * @param num The operand.
   * @returns The current object (for chaining).
   */
  mod(num: EBExprOperatorInput) {
    this.expr = `${this.expr},%${this.preCheck(num)}`;
    return this;
  }

  /**
   * Bitwise XOR operation.
   * @param num The operand.
   * @returns The current object (for chaining).
   */
  bitwiseXOR(num: EBExprOperatorInput) {
    this.expr = `${this.expr},^${this.preCheck(num)}`;
    return this;
  }

  /**
   * Assignment operation.
   * @param num The operand.
   * @returns The current object (for chaining).
   */
  assign(num: EBExprOperatorInput) {
    this.expr = `${this.expr},=${this.preCheck(num)}`;
    return this;
  }

  /**
   * Absolute value operation.
   * Returns the absolute value of the current expression.
   * @returns The current object (for chaining).
   */
  absolute() {
     this.expr = `${this.expr},|_|0`;
    return this;
  }

  /**
   * 
   */

}

/**
 * CopyData class, extends EBExpr. Used for copy operations.
 */
export class CopyData extends EBExpr {
  private _name:string = "CopyData"
}

/**
 * CalcData class, extends EBExpr. Used for calculation operations.
 */
export class CalcData extends EBExpr {
  private _name:string = "CalcData"
}
