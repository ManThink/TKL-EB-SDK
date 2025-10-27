import { CalcData, CopyData } from "./EBExpr";
import { ActionAfertExpr, CrcMode, CrcPosition, ExprCondition, PeriodUnit } from "./EBEnum";

/**
 * Represents a time period with value and unit
 */
export interface PeriodValue {
  periodValue: number; // Numeric value of the period
  unit: PeriodUnit; // Time unit for the period
}

/**
 * Configuration parameters for CRC calculation
 */
export interface CrcPara {
  /** 
   * CRC algorithm mode
   * 
   */
  Mode: CrcMode; // CRC algorithm mode
  /**
   * Polynomial
   * @optional
   */
  Poly?: string; 
  /**
   * Bytes Length of CRC
   */
  CrcLen: number;
  /**
   * Start index for data range
   */
  StartIdx: number; 
  /**
   * End index for data range
   */
  EndIdx: number; 
  /**
   * Position to insert CRC result
   */
  PlaceIdx: number; 
  /** 
    @description Direction for [PlaceIdx] counting
    @example 
    - true:  from right
    - false: from left
   */ 
  PlaceInvert: boolean; 
  /**
   * Whether little-endian byte order
   */
  LittleEndian: boolean; // 是否小端字节序
}

/**
 * Byte pattern matching in payload, starting subsequent operations from the matched position
 */
export interface TagCheckProp {
  /**
   * Single byte tag identifier in hexadecimal format
   * @pattern ^[0-9A-Fa-f]{2}$ - Must be exactly 2 hex characters (1 byte)
   * @example "A0" - Represents byte 0xA0
   * @example "FF" - Represents byte 0xFF
   */
  tag: string; 
  /**
   * Start check position in payload;
   */
  index: number;

  /**
   * This setting determines the starting point and direction for indexing and matching.
   * 
   * @description When set to "true", the index is counted from right to left, and data is matched sequentially in that direction. 
   * When "false", indexing and matching proceed from left to right.
   */

  invert: boolean; 

}

/**
 * Copy extra options interface.
 */
export type CopyExtraOption = {
  condition?: ExprCondition; //  Condition for the copy action
};

/**
 * Calculation extra options interface.
 */
export type CalcExtraOption = {
  /**
   * Condition for the calculation action
   */
  condition?: ExprCondition; 
  /**
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
   */
  Repeat?: number | null; 
  /**
   * Action after calculation
   */
  ActAfterCvt?: ActionAfertExpr | null; 
};

/**
 * Generic interface for operation type, dynamically returns CopyExtraOption or CalcExtraOption
 * based on the input type T.
 */
export type OperationType<T> = T extends CopyData ? CopyExtraOption: CalcExtraOption;

/**
 *  CRC option type, can be CRC16_Option, CCITT16_Option, or SUM_Option.
 */
export type CrcOption = CRC16_Option | CCITT16_Option | SUM_Option;

/**
 * CRC16 option interface.
 */
export interface CRC16_Option {
  /**
   * CRC mode is CRC16
   */
  Mode: CrcMode.CRC16;
  /**
   * Polynomial (optional)
   */
  Poly?: string; 
  /** 
   * Placement index, -1: refers to the last element.
   * 
  */
  placeIndex?: number; 
  /**
   * Whether little-endian byte order
  */
  LittleEndian?: boolean; 
  crcCheckRange?: {
    /**
     * Start index for data range
    */
    startIndex: number; 
     /**
     * End index for data range
    */
    endIndex: number; 
  };
}

/**
 * CCITT16选项接口
 */
export interface CCITT16_Option {
  /**
   * Polynomial
   * @optional
  */
  Mode: CrcMode.CCITT16; 
  /**
   * Polynomial
   * @optional
  */
  Poly?: string; 
  /** 
   * Placement index, -1: refers to the last element.
   * 
  */
  placeIndex?: number; 
  /**
   * Whether little-endian byte order
  */
  LittleEndian?: boolean;

  crcCheckRange?: {
    /**
     * Start index for data range
    */
    startIndex: number;
    /**
     * End index for data range
    */
    endIndex: number; 
  };
}

/**
  * SUM option interface.
*/
export interface SUM_Option {
  /**
   *  CRC mode is SUM
   */
  Mode: CrcMode.SUM; 
  /**
   * Bytes Length of CRC
  */
  CrcLen?: number; 
  /** 
   * Placement index, -1: refers to the last element.
   * 
  */
  placeIndex?: number; 
  /**
   * Whether little-endian byte order
  */
  LittleEndian?: boolean; 

  crcCheckRange?: {
    /**
     * Start index for data range
    */
    startIndex: number; 
    /**
     * End index for data range
    */
    endIndex: number; 
  };
}

/**
 * Configuration for the copy rule during intermediate data processing.
 * Defines what data to copy and under what conditions.
 */
export interface CopyRuleInitProp {
  CopyRule: string; 
  CopyCond?: ExprCondition;
}

/**
 * Configuration for generating parameters in the intermediate JSON file.
 * This defines the conversion rule and its execution behavior.
 */
export interface CvtRuleInitProp {
  /**
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
   */
  Repeat?: number | null;
  
  CvtCond?: ExprCondition; 
  /**
   * Action after calculation
   */
  ActAfterCvt?: ActionAfertExpr | null; 
  CvtRule: string; 
}