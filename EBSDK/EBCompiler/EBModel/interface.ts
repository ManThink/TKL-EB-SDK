import { CalcData, CopyData } from "./EBExpr";
import { ActionAfertExpr, CrcMode, CrcPosition, ExprCondition, PeriodUnit } from "./EBEnum";

/**
 * 周期值接口，用于表示周期值和单位
 */
export interface PeriodValue {
  periodValue: number; // 周期值
  unit: PeriodUnit; // 周期单位
}

/**
 * CRC参数接口，用于定义CRC计算的相关参数
 */
export interface CrcPara {
  Mode: CrcMode; // CRC模式
  Poly?: string; // 多项式（可选）
  CrcLen: number; // CRC长度
  StartIdx: number; // 起始索引
  EndIdx: number; // 结束索引
  PlaceIdx: number; // 放置索引
  PlaceInvert: boolean; // 是否反转放置
  LittleEndian: boolean; // 是否小端字节序
}

/**
 * BINOPT接口，用于定义二进制操作的相关事件列表
 */
export interface BINOPT {
  loraUpEventList: Array<any>; // LoRa上行事件列表
  queryEventlist: Array<any>; // 查询事件列表
}

/**
 * 标签检查属性接口，用于定义标签检查的相关属性
 */
export interface TagCheckProp {
  tag: string; // 标签
  invert: boolean; // 是否反转
  index: number; // 索引
}

/**
 * 复制额外选项接口
 */
export type CopyExtraOption = {
  condition?: ExprCondition; // 复制条件
};

/**
 * 计算额外选项接口
 */
export type CalcExtraOption = {
  condition?: ExprCondition; // 计算条件
  Repeat?: number | null; // 重复次数
  ActAfterCvt?: ActionAfertExpr | null; // 转换后操作
};

/**
 * 操作类型泛型接口，根据输入类型动态返回CopyExtraOption或CalcExtraOption
 */
export type OperationType<T extends CopyData | CalcData> = T extends CopyData
  ? CopyExtraOption
  : CalcExtraOption;

/**
 * CRC选项类型，可以是CRC16_Option、CCITT16_Option或SUM_Option
 */
export type CrcOption = CRC16_Option | CCITT16_Option | SUM_Option;

/**
 * CRC16选项接口
 */
export interface CRC16_Option {
  Mode: CrcMode.CRC16; // CRC模式为CRC16
  Poly?: string; // 多项式（可选）
  placeIndex?: number; // 放置索引（可选）
  LittleEndian?: boolean; // 是否小端字节序（可选）
  crcCheckRange?: {
    startIndex: number; // CRC检查范围的起始索引
    endIndex: number; // CRC检查范围的结束索引
  };
}

/**
 * CCITT16选项接口
 */
export interface CCITT16_Option {
  Mode: CrcMode.CCITT16; // CRC模式为CCITT16
  Poly?: string; // 多项式（可选）
  placeIndex?: number; // 放置索引（可选）
  LittleEndian?: boolean; // 是否小端字节序（可选）
  crcCheckRange?: {
    startIndex: number; // CRC检查范围的起始索引
    endIndex: number; // CRC检查范围的结束索引
  };
}

/**
 * SUM选项接口
 */
export interface SUM_Option {
  Mode: CrcMode.SUM; // CRC模式为SUM
  CrcLen?: number; // CRC长度（可选）
  placeIndex?: number; // 放置索引（可选）
  LittleEndian?: boolean; // 是否小端字节序（可选）
  crcCheckRange?: {
    startIndex: number; // CRC检查范围的起始索引
    endIndex: number; // CRC检查范围的结束索引
  };
}

/**
 * 复制规则初始化属性接口
 */
export interface CopyRuleInitProp {
  CopyRule: string; // 复制规则
  CopyCond?: ExprCondition; // 复制条件（可选）
}

/**
 * 转换规则初始化属性接口
 */
export interface CvtRuleInitProp {
  Repeat?: number | null; // 重复次数（可选）
  CvtCond?: ExprCondition; // 转换条件（可选）
  ActAfterCvt?: ActionAfertExpr | null; // 转换后操作（可选）
  CvtRule: string; // 转换规则
}