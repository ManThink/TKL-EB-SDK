/**
 * @enum {string}
 * @description Enumeration of action types to be executed after the <CvtRule> calculation/assignment action is completed.
 * @property {string} NONE - No action.
 * @property {string} ALWAYS - Upload directly.
 * @property {string} UP_TO_RESULT - Upload based on the result of the assignment object; upload only if the result of CvtRule is > 0.
 * @property {string} ALWAYS_REBOOT - Unconditionally reboot after a query.
 */
export enum ActionAfertExpr {
  NONE = "none",
  ALWAYS = "up",   
  UP_TO_RESULT = "upr",
  ALWAYS_REBOOT = "rst" 
}

/**
 * @enum {string}
 * @description Checksum algorithm.
 * @property {string} CRC16 - CRC16 checksum.
 * @property {string} CCITT16 - CCITT16 checksum.
 * @property {string} SUM - Sum checksum.
 */
export enum CrcMode {
  CRC16 = "crc16",
  CCITT16 = "ccitt16",
  SUM = "sum"
}

/**
 * @enum {string}
 * @description Execution condition for actions within an event.
 * - If the current event is QueryEvent, the condition is based on the execution result of the current query event.
 * - If the current event is UpEvent, the condition is based on the execution result of the most recent query event.
 * @property {string} NONE - Execute unconditionally.
 * @property {string} ONTIME - Execute when not timed out.
 * @property {string} TIMEOUT - Execute when timed out.
 */
export enum ExprCondition {
  /** Execute the action unconditionally, regardless of the query event result. */
  NONE = "none",      
  /** Execute when the most recently executed query event did not time out. */    
  ONTIME = "ontime",   
  /** Execute when the most recently executed query event timed out. */
  TIMEOUT = "timeout" 
}

/**
 * @enum {string}
 * @description Position of the CRC checksum code.
 * @property {string} LEFT - The CRC checksum code is placed on the left.
 * @property {string} RIGHT - The CRC checksum code is placed on the right.
 */
export enum CrcPosition {
  /** CRC checksum code is placed on the left. */
  LEFT = "left",
  /** CRC checksum code is placed on the right. */
  RIGHT = "right"
}

/**
 * @enum {string}
 * @description Type of LoRaUpEvent uplink event.
 * @property {string} NORMAL - Represents a normal uplink event.
 */
export enum UpEventType {
  NORMAL = "normal"
}

/**
 * @enum {string}
 * @description Enumeration of period units.
 * @property {string} SECOND - Second.
 * @property {string} MINUTE - Minute.
 * @property {string} HOUR - Hour.
 * @property {string} DAY - Day.
 */
export enum PeriodUnit {
  SECOND = "s", // second
  MINUTE = "m", // minute
  HOUR = "h", // hour
  DAY = "d" // day
}

/**
 * @enum {string}
 * @description Enumeration for selecting the query interface.
 * @property {string} uart2 - Use UART2 for querying.
 * @property {string} no_query - Do not perform a query; proceed directly to subsequent operations.
 */
export enum IfSelectEnum {
  uart2 = "uart2",
  no_query = "no_query" 
}