/**
 * 表达式操作符输入类型，可以是字符串、数字或EBExpr对象
 */
export type EBExprOperatorInput = string | number | EBExpr;

/**
 * EBExpr类，用于构建和操作表达式
 */
export class EBExpr {
  protected optCout: number = 0; // 操作符计数
  protected expr: string = ""; // 表达式字符串
  protected readonly: boolean = false; // 是否只读

  /**
   * 构造函数
   * @param {EBExprOperatorInput} v - 表达式初始值
   * @param {boolean} [readonly=false] - 是否只读, 如果为只读数据
   */
  constructor(v: EBExprOperatorInput, readonly: boolean = false) {
    this.expr = this.preCheck(v);
    this.readonly = readonly;
  }

  /**
   * 预检查表达式输入
   * @param {EBExprOperatorInput} expr - 表达式输入
   * @returns {string} - 返回处理后的表达式字符串
   * @throws {Error} - 如果表达式只读或操作符超过6个，抛出错误
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
   * 获取当前表达式的值
   * @returns {string} - 返回表达式字符串
   */
  public getValue(): string {
    return this.expr;
  }

  /**
   * 乘法操作
   * @param {EBExprOperatorInput} num - 乘数
   * @returns {EBExpr} - 返回当前对象
   */
  multiply(num: EBExprOperatorInput) {
    this.expr = `${this.expr},*${this.preCheck(num)}`;
    return this;
  }

  /**
   * 除法操作
   * @param {EBExprOperatorInput} num - 除数
   * @returns {EBExpr} - 返回当前对象
   */
  divide(num: EBExprOperatorInput) {
    this.expr = `${this.expr},/${this.preCheck(num)}`;
    return this;
  }

  /**
   * 加法操作
   * @param {EBExprOperatorInput} num - 加数
   * @returns {EBExpr} - 返回当前对象
   */
  add(num: EBExprOperatorInput) {
    this.expr = `${this.expr},+${this.preCheck(num)}`;
    return this;
  }

  /**
   * 减法操作
   * @param {EBExprOperatorInput} num - 减数
   * @returns {EBExpr} - 返回当前对象
   */
  minus(num: EBExprOperatorInput) {
    this.expr = `${this.expr},-${this.preCheck(num)}`;
    return this;
  }

  /**
   * 按位与操作
   * @param {EBExprOperatorInput} num - 操作数
   * @returns {EBExpr} - 返回当前对象
   */
  bitwiseAnd(num: EBExprOperatorInput) {
    this.expr = `${this.expr},&${this.preCheck(num)}`;
    return this;
  }

  /**
   * 幂运算操作
   * @param {EBExprOperatorInput} num - 指数
   * @returns {EBExpr} - 返回当前对象
   */
  power(num: EBExprOperatorInput) {
    this.expr = `${this.expr},@${this.preCheck(num)}`;
    return this;
  }

  /**
   * 按位取反操作
   * @param {EBExprOperatorInput} num - 操作数
   * @returns {EBExpr} - 返回当前对象
   */
  not(num: EBExprOperatorInput) {
    this.expr = `${this.expr},!${this.preCheck(num)}`;
    return this;
  }

  /**
   * 左移操作
   * @param {EBExprOperatorInput} num - 移动位数
   * @returns {EBExpr} - 返回当前对象
   */
  leftShift(num: EBExprOperatorInput) {
    this.expr = `${this.expr},<<${this.preCheck(num)}`;
    return this;
  }

  /**
   * 右移操作
   * @param {EBExprOperatorInput} num - 移动位数
   * @returns {EBExpr} - 返回当前对象
   */
  rightShift(num: EBExprOperatorInput) {
    this.expr = `${this.expr},>>${this.preCheck(num)}`;
    return this;
  }

  /**
   * 按位或操作
   * @param {EBExprOperatorInput} num - 操作数
   * @returns {EBExpr} - 返回当前对象
   */
  bitwiseOr(num: EBExprOperatorInput) {
    this.expr = `${this.expr},|${this.preCheck(num)}`;
    return this;
  }

  /**
   * 不等于操作
   * @param {EBExprOperatorInput} num - 操作数
   * @returns {EBExpr} - 返回当前对象
   */
  notEqual(num: EBExprOperatorInput) {
    this.expr = `${this.expr},!=${this.preCheck(num)}`;
    return this;
  }

  /**
   * 等于操作
   * @param {EBExprOperatorInput} num - 操作数
   * @returns {EBExpr} - 返回当前对象
   */
  equal(num: EBExprOperatorInput) {
    this.expr = `${this.expr},==${this.preCheck(num)}`;
    return this;
  }

  /**
   * 小于操作
   * @param {EBExprOperatorInput} num - 操作数
   * @returns {EBExpr} - 返回当前对象
   */
  lessThan(num: EBExprOperatorInput) {
    this.expr = `${this.expr},<${this.preCheck(num)}`;
    return this;
  }

  /**
   * 大于操作
   * @param {EBExprOperatorInput} num - 操作数
   * @returns {EBExpr} - 返回当前对象
   */
  greaterThan(num: EBExprOperatorInput) {
    this.expr = `${this.expr},>${this.preCheck(num)}`;
    return this;
  }

  /**
   * 取模操作
   * @param {EBExprOperatorInput} num - 操作数
   * @returns {EBExpr} - 返回当前对象
   */
  mod(num: EBExprOperatorInput) {
    this.expr = `${this.expr},%${this.preCheck(num)}`;
    return this;
  }

  /**
   * 按位异或操作
   * @param {EBExprOperatorInput} num - 操作数
   * @returns {EBExpr} - 返回当前对象
   */
  bitwiseXOR(num: EBExprOperatorInput) {
    this.expr = `${this.expr},^${this.preCheck(num)}`;
    return this;
  }

  /**
   * 赋值操作
   * @param {EBExprOperatorInput} num - 操作数
   * @returns {EBExpr} - 返回当前对象
   */
  assign(num: EBExprOperatorInput) {
    this.expr = `${this.expr},=${this.preCheck(num)}`;
    return this;
  }
}

/**
 * CopyData类，继承自EBExpr
 */
export class CopyData extends EBExpr {
  private _name:string = "CopyData"
}

/**
 * CalcData类，继承自EBExpr
 */
export class CalcData extends EBExpr {
  private _name:string = "CalcData"
}