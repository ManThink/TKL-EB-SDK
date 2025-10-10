
import { CalcData, CopyData, EBExpr } from "../EBExpr";
import { CopyRule, CvtRule } from "../EBRule";
import { ActionAfertExpr, ExprCondition, PeriodUnit } from "../EBEnum";
import {  CopyRuleInitProp, CvtRuleInitProp, PeriodValue } from "../interface";

/**
 * @type
 * 复制操作的配置项, 
 */
type CopyExtraOption = {
  condition?: ExprCondition
}
type CalcExtraOption = {
  condition?: ExprCondition,
  Repeat?: number | null;
  ActAfterCvt?: ActionAfertExpr | null;
}
type OperationType<T> = T extends CopyData ? CopyExtraOption: CalcExtraOption;

/**
 * 这是一个基础的事件类
 * 1. 定义了LoRaWan上行消息事件
 * 2. 通过串口中读取数据的事件
 * 事件中动作有两个类型(计算赋值动作<CvtRule>, 复制动作<CopyRule>)的数组，分别为:
 * - caculist：根据计算表达式计算完成后，将结果赋值给一个参数。
 * - copyList：直接将一个 Buffer 复制到指定参数的 Buffer 中。
 *
 */
export class BaseEvent {

  /**
   * 事件名称
   */
  protected name:string;

  /**
   * 事件周期的最大周期值, 单位可为秒、分钟、小时、天
   */
  private maxPeriodValue = 0x3FFF;  // 16383

  // 构造函数，接受一个字符串参数 name，并将其赋值给成员变量 name
  constructor(name:string) {
    this.name = name;
  }

  /**
   * @returns 事件名称
   */
  getName():string {
    return this.name
  }

  /**
   * 事件执行周期, 默认为300s
   */
  protected queryPeriod: PeriodValue = {
    periodValue: 300,
    unit: PeriodUnit.SECOND
  }

  /**
   * 储存该事件触发前所有需要执行的计算和赋值操作
   */
  public caculist: Array<CvtRule> = [];
   /**
   * 储存该事件触发前所有需要执行的Buffer复制操作
   */
  public copyList: Array<CopyRule> = []

  // 公共方法，设置周期值
  /**
   * 设置事件的周期, 默认单位为秒, 根据周期值大小与最大周期值进行比较,如果超出最大值的话,则向下一个单位转换
   * @param period 
   * @returns 
   */
  setPeriod(period: number) {

    // 默认单位为秒
    let unit:PeriodValue['unit'] = PeriodUnit.SECOND;
    let periodValue = period;
    // 根据周期值的大小设置单位和周期值
    if (period < this.maxPeriodValue) {
      unit = PeriodUnit.SECOND;
      periodValue = period;
    } else if (period < this.maxPeriodValue * 60) {
      unit = PeriodUnit.MINUTE;
      periodValue = Math.floor(period / 60);
    } else if (period < this.maxPeriodValue * 60 * 60) {
      unit = PeriodUnit.HOUR;
      periodValue = Math.floor(period / 60 / 60);
    } else if (period < this.maxPeriodValue * 60 * 60 * 24) {
      unit = PeriodUnit.DAY;
      periodValue = Math.floor(period / 60 / 60 / 24);
    } else {
      // 如果周期值超出范围，抛出错误
      throw new Error("period is out of range");
    }

    // 更新查询周期的值和单位
    this.queryPeriod.periodValue = periodValue;
    this.queryPeriod.unit = unit;
    
    // 返回当前对象
    return this;
  }

  /**
   * 类中的成员变量转换为JSON格式
   * @returns 事件参数的JSON格式
   */
  toJSON() {
    return {
      name: this.name,
      caculist: this.caculist.length ? this.caculist : undefined,
      copyList: this.copyList.length ? this.copyList : undefined
    }
  }
  // 公共方法，向事件添加数据
  /**
   * 
   * @param ebData 复制操作或计算操作
   * @param option 
   * @returns 
   */
  pushEBData<T extends EBExpr>(ebData:T, option: OperationType<T>={}) {
    // 如果数据是 CopyData 类型
    if (ebData instanceof CopyData) {
      let nextoption:CopyRuleInitProp = {
        CopyCond: option.condition || ExprCondition.NONE,
        CopyRule: ebData.getValue()
      }
      // 将新的复制规则添加到复制规则列表中
      this.copyList.push(new CopyRule(nextoption));
      if(this.copyList.length > 15) {
        throw new Error(`ERROR: Maximum CopyRule count is 15. You have ${this.copyList.length}.`);
      }
      return 
    // 如果数据是 CalcData 类型
    } else if (ebData instanceof CalcData) {
      let nextoption:CvtRuleInitProp = {
        CvtCond: option.condition || ExprCondition.NONE,
        CvtRule: ebData.getValue(),
        Repeat: (option as CalcExtraOption)?.Repeat ?? null,
        ActAfterCvt: (option as CalcExtraOption)?.ActAfterCvt ?? null
      }
      // 将新的计算规则添加到计算规则列表中
      this.caculist.push(new CvtRule(nextoption));
      if(this.caculist.length > 15) {
        throw new Error(`ERROR: Maximum CvtRule count is 15. You have ${this.caculist.length}.`);
      }
      return 
    }

    // 如果数据类型错误，抛出错误
    throw new Error("ebData type error");
  }
}