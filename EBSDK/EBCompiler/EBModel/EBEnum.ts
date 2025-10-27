/**
 * @enum {string}
 * @description 计算赋值动作<CvtRule>执行完成后需要要执行的动作类型枚举
 * @property {string} NONE - 无动作
 * @property {string} UP - 直接上传
 * @property {string} UP_TO_RESULT - 根据前面的赋值对象决定是否上传, 该上传对象中只要有CvtRule后的结果>0 才上传
 * @property {string} ALWAYS_REBOOT - 查询后无条件重启
 */
export enum ActionAfertExpr {
  NONE = "none",
  ALWAYS = "up",   
  UP_TO_RESULT = "upr",
  ALWAYS_REBOOT = "rst" 
}

/**
 * @enum {string}
 * @description 检验算法
 * @property {string} CRC16 - CRC16校验
 * @property {string} CCITT16 - CCITT16校验
 * @property {string} SUM - 求和校验
 */
export enum CrcMode {
  CRC16 = "crc16",
  CCITT16 = "ccitt16",
  SUM = "sum"
}

/**
 * @enum {string}
 * @description 事件中动作的执行条件 
 * - 如果当前事件为 QueryEvent, 则判断对象为当前查询事件的执行结果
 * - 如果当前事件为 UpEvent, 则判断对象为最近一次查询事件的执行结果
 * @property {string} NONE - 无条件执行
 * @property {string} ONTIME  - 未超时时执行
 * @property {string} TIMEOUT - 超时时执行
 */
export enum ExprCondition {
  /** 无论查询事件结果是什么都无条件执行该动作 */
  NONE = "none",      
  /** 最近一次执行的查询事件未超时时执行  */    
  ONTIME = "ontime",   
  /** 最近一次执行的查询事件超时时执行  */
  TIMEOUT = "timeout" 
}

/**
 * @enum {string}
 * @description CRC校验码存放的位置枚举。
 * @property {string} LEFT - 表示CRC校验码存放在左侧。
 * @property {string} RIGHT - 表示CRC校验码存放在右侧。
 */

export enum CrcPosition {
  /** CRC校验码存放在左侧 */
  LEFT = "left",
  /** CRC校验码存放在右侧 */
  RIGHT = "right"
}

/**
 * @enum {string}
 * @description LoraUpEvent 上行事件类型枚举。
 * @property {string} NORMAL - 表示普通上行事件。
 */
export enum UpEventType {
  NORMAL = "normal"
}

/**
 * @enum {string}
 * @description 周期单位枚举。
 * @property {string} SECOND - 表示秒。
 * @property {string} MINUTE - 表示分钟。
 * @property {string} HOUR - 表示小时。
 * @property {string} DAY - 表示天。
 */
export enum PeriodUnit {
  SECOND = "s", // second
  MINUTE = "m", // minute
  HOUR = "h", // hour
  DAY = "d" // day
}