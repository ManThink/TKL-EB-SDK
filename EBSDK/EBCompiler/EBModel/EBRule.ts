import { CalcData, CopyData } from "./EBExpr";
import { ActionAfertExpr, ExprCondition } from "./EBEnum";
import { CopyRuleInitProp, CvtRuleInitProp } from "./interface";

/**
 * CopyRule class, used to define copy rules.
 */
export class CopyRule {
  protected CopyRule: string; // The copy rule expression
  protected CopyCond: ExprCondition; // The condition for the copy action


  /**
   * 构造函数
   * @param {CopyRuleInitProp} props - Initialization properties.
   * @param {string} props.CopyRule - The copy rule expression (required).
   * @param {ExprCondition} [props.CopyCond=ExprCondition.NONE] - The copy condition, defaults to ExprCondition.NONE.
   * @throws {Error} - If CopyRule is not provided.
   */
  constructor({ CopyRule, CopyCond = ExprCondition.NONE }: CopyRuleInitProp) {
    if (!CopyRule) throw new Error("CopyRule is required");
    this.CopyRule = CopyRule;
    this.CopyCond = CopyCond;
  }
}

/**
 * CvtRule class, used to define conversion/calculation rules.
 */
export class CvtRule  {
  
  private Repeat?: number | null = 1; 
  private CvtCond?: ExprCondition = ExprCondition.ONTIME; 
  private ActAfterCvt?: ActionAfertExpr | null = ActionAfertExpr.NONE; 
  private CvtRule: string; 
  

  /**
   * 构造函数
   * @param {CvtRuleInitProp} props - Initialization properties.
   * @param {CvtRule["Repeat"]} [props.Repeat=1] 
   * @description - Number of repetitions, defaults to 1.
   *
   * For a calc action, the loop operation count is implemented with the following result:
   * 
   * ``` 
   *    quEvent1.pushEBData(upEvent1.txBuffer.writeUintLE(quEvent1.ackBuffer.readBcd(2,7),3,6), {condition: ExprCondition.ONTIME})
   * ```
   * is equivalent to:
   * ```
   *    // Iteration 1: Read from position 2
   *    quEvent1.pushEBData(upEvent1.txBuffer.writeUintLE(quEvent1.ackBuffer.readBcd(2,7),3,6));
   * 
   *    // Iteration 2: Read from position 9 (2 + 7)
   *    quEvent1.pushEBData(upEvent1.txBuffer.writeUintLE(quEvent1.ackBuffer.readBcd(9,7),9,6));
   * 
   *    // Iteration 3: Read from position 16 (9 + 7)
   *    quEvent1.pushEBData(upEvent1.txBuffer.writeUintLE(quEvent1.ackBuffer.readBcd(16,7),16,6));
   * ```
   * 
   * @param {ExprCondition} [props.CvtCond=ExprCondition.ONTIME] - Action after conversion/calculation, defaults to ActionAfertExpr.NONE
   * @param {ActionAfertExpr} [props.ActAfterCvt=ActionAfertExpr.NONE] - Action after conversion/calculation, defaults to ActionAfertExpr.NONE.
   * @param {string} props.CvtRule - CvtRule is obtained by calling new CopyData(...args).getValue() or new CalcData(...args).getValue().
   * @throws {Error} - If CvtRule is not provided.
   */
  constructor({
    Repeat = 1,
    CvtCond = ExprCondition.ONTIME,
    ActAfterCvt = ActionAfertExpr.NONE,
    CvtRule,
  }: CvtRuleInitProp) {
    if (!CvtRule) {
      throw new Error("CvtRule is required");
    }
    this.Repeat = Repeat;
    this.CvtCond = CvtCond;
    this.ActAfterCvt = ActAfterCvt;
    this.CvtRule = CvtRule;
  }
}