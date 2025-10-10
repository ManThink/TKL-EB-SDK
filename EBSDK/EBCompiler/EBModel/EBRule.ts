import { CalcData, CopyData } from "./EBExpr";
import { ActionAfertExpr, ExprCondition } from "./EBEnum";
import { CopyRuleInitProp, CvtRuleInitProp } from "./interface";

/**
 * CopyRule类，用于定义复制规则
 */
export class CopyRule {
  protected CopyRule: string; // 复制规则
  protected CopyCond: ExprCondition; // 复制条件

  /**
   * 构造函数
   * @param {CopyRuleInitProp} props - 初始化属性
   * @param {string} props.CopyRule - 复制规则（必填）
   * @param {ExprCondition} [props.CopyCond=ExprCondition.NONE] - 复制条件，默认为NONE
   * @throws {Error} - 如果CopyRule未提供，抛出错误
   */
  constructor({ CopyRule, CopyCond = ExprCondition.NONE }: CopyRuleInitProp) {
    if (!CopyRule) throw new Error("CopyRule is required");
    this.CopyRule = CopyRule;
    this.CopyCond = CopyCond;
  }
}

/**
 * CvtRule类，用于定义转换规则
 */
export class CvtRule {
  private Repeat?: number | null = 1; // 重复次数
  private CvtCond?: ExprCondition = ExprCondition.ONTIME; // 转换条件
  private ActAfterCvt?: ActionAfertExpr | null = ActionAfertExpr.NONE; // 转换后操作
  private CvtRule: string; // 转换规则

  /**
   * 构造函数
   * @param {CvtRuleInitProp} props - 初始化属性
   * @param {number} [props.Repeat=1] - 重复次数，默认为1
   * @param {ExprCondition} [props.CvtCond=ExprCondition.ONTIME] - 转换条件，默认为ONTIME
   * @param {ActionAfertExpr} [props.ActAfterCvt=ActionAfertExpr.NONE] - 转换后操作，默认为NONE
   * @param {string} props.CvtRule - 转换规则（必填）
   * @throws {Error} - 如果CvtRule未提供，抛出错误
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