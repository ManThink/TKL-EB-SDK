
import { CalcData, CopyData, EBExpr } from "../EBExpr";
import { CopyRule, CvtRule } from "../EBRule";
import { ExprCondition, PeriodUnit } from "../EBEnum";
import { CalcExtraOption, CopyRuleInitProp, CvtRuleInitProp, OperationType, PeriodValue } from "../interface";


/**
 * This is a base event class.
 * 1. Defines LoRaWAN uplink message events.
 * 2. Defines events for reading data from the serial port.
 * The actions within the event are stored in two arrays of types (Calculation/Assignment Action <CvtRule>, Copy Action <CopyRule>):
 * - caculist: Stores actions where the result of a calculation expression is assigned to a parameter.
 * - copyList: Stores actions where a Buffer is directly copied to a specified parameter's Buffer.
 *
 */
export class BaseEvent {

  /**
   * Event name
   */
  protected name:string;

  /**
   * The maximum period value for the event cycle. Units can be seconds, minutes, hours, or days.
   */
  private maxPeriodValue = 0x3FFF;  

  /**
   * @param name The name of the event.
   */
  constructor(name:string) {
    this.name = name;
  }

  /**
   * @returns The name of the event.
   */
  getName():string {
    return this.name
  }

  /**
   * The execution period of the event, defaults to 300s.
  */
  protected queryPeriod: PeriodValue = {
    periodValue: 300,
    unit: PeriodUnit.SECOND
  }

 /**
   * Stores all calculation and assignment operations that need to be executed before this event is triggered.
   */
  public caculist: Array<CvtRule> = [];
   /**
   * Stores all Buffer copy operations that need to be executed before this event is triggered.
   */
  public copyList: Array<CopyRule> = []

  /**
   * Sets the period of the event. The default unit is seconds. 
   * The unit is converted to the next larger unit if the period value exceeds the maximum period value.
   * @param period The period value in seconds.
   * @returns The current object (for chaining).
   */
  setPeriod(period: number) {

    let unit:PeriodValue['unit'] = PeriodUnit.SECOND;
    let periodValue = period;
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
      if (periodValue > 0x3000) {
        throw new Error("The maximum period time is 12288 days.")
      }
    } else {
      throw new Error("period is out of range");
    }

    this.queryPeriod.periodValue = periodValue;
    this.queryPeriod.unit = unit;
    
    return this;
  }

  /**
 * Configures the period using a register address mapping.
 * 
 * @param unit8_addr - Register address (0x00-0xC4) for period configuration
 * @returns Current instance for chaining
 */
  setPeriodFromApp(unit8_addr:number) {
    if (unit8_addr > 0xc4 || unit8_addr < 0) {
      throw new Error(`Invalid address: 0x${unit8_addr.toString(16).toUpperCase()}. Valid address range: 0x00 - 0xC7`);
    }  
    this.queryPeriod.periodValue = unit8_addr + 0x3000;
    this.queryPeriod.unit = PeriodUnit.DAY;
    return this
  }

  /**
   * Converts the member variables of the class to JSON format.
   * @returns The JSON format of the event parameters.
   */
  toJSON() {
    return {
      name: this.name,
      caculist: this.caculist.length ? this.caculist : undefined,
      copyList: this.copyList.length ? this.copyList : undefined
    }
  }
  /**
   * Adds a copy or calculation operation to the event's action list.
   * @param ebData The copy or calculation operation (CopyData or CalcData).
   * @param option The extra options for the operation.
   * @returns void
   */
  pushEBData<T extends EBExpr>(ebData:T, option: OperationType<T>={}) {
    // check EBExpr Type
    if (ebData instanceof CopyData) {
      let nextoption:CopyRuleInitProp = {
        CopyCond: option.condition || ExprCondition.NONE,
        CopyRule: ebData.getValue()
      }
      // Add the new copy rule to the copy rule list
      this.copyList.push(new CopyRule(nextoption));
      if(this.copyList.length > 15) {
        throw new Error(`ERROR: Maximum CopyRule count is 15. You have ${this.copyList.length}.`);
      }
      return 
    } else if (ebData instanceof CalcData) {
      let nextoption:CvtRuleInitProp = {
        CvtCond: option.condition || ExprCondition.NONE,
        CvtRule: ebData.getValue(),
        Repeat: (option as CalcExtraOption)?.Repeat ?? null,
        ActAfterCvt: (option as CalcExtraOption)?.ActAfterCvt ?? null
      }
      // Add the new calculation rule to the calculation rule list
      this.caculist.push(new CvtRule(nextoption));
      if(this.caculist.length > 15) {
        throw new Error(`ERROR: Maximum CvtRule count is 15. You have ${this.caculist.length}.`);
      }
      return 
    }
    // Throw an error if the data type is incorrect
    throw new Error("ebData type error");
  }
}