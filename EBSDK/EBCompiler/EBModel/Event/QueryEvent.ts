import { EBBuffer } from "../EBBuffer";
import { EBModel } from "../EBModel";
import { CopyRule, CvtRule } from "../EBRule";
import { CrcMode, CrcPosition } from "../EBEnum";
import { CrcOption, CrcPara, PeriodValue, TagCheckProp } from "../interface";
import { BaseEvent } from "./BaseEvent";
import { Buffer } from "buffer";

/**
 * QueryEvent类，用于表示查询事件
 */
export class QueryEvent extends BaseEvent {
  static ebModel: EBModel | null = null; // 静态属性，用于存储EBModel实例
  public ackBuffer: EBBuffer = new EBBuffer("ack", Buffer.alloc(0)); // 确认缓冲区
  public cmdBuffer: EBBuffer = new EBBuffer("cmd", Buffer.alloc(0)); // 命令缓冲区
  protected ackCrcPara!: CrcPara; // 确认CRC参数
  protected queryCrcPara!: CrcPara; // 查询CRC参数
  protected tagCheckList: Array<TagCheckProp> = []; // 标签检查列表
  protected fixedAcq!: boolean; // 是否固定采集
  protected fixedMoment!: number; // 固定采集时刻

  /**
   * 构造函数
   * @param {string} name - 事件名称
   * @param {Object} options - 事件配置
   * @param {Buffer} options.ackBuffer - 485设备返回的数据的缓存区
   * @param {Buffer} options.cmdBuffer - 下发给485设备的查询命令缓存区
   * @throws {Error} - 如果未设置QueryEvent.ebModel，抛出错误
   */
  constructor(
    name: string,
    { ackBuffer, cmdBuffer }: { ackBuffer: Buffer; cmdBuffer: Buffer }
  ) {
    if (!QueryEvent.ebModel) {
      throw new Error(
        'QueryEvent.ebModel is not set, please use "QueryEvent.ebModel = ebModel" code for initialization'
      );
    }
    super(name);
    this.ackBuffer = new EBBuffer(`ack`, ackBuffer);
    this.cmdBuffer = new EBBuffer(`cmd`, cmdBuffer);
    QueryEvent.ebModel?.addEvent(this);
  }

  /**
   * 获取CRC参数
   * @param {CrcOption} option - CRC选项
   * @param {EBBuffer} ebBuffer - 缓冲区
   * @returns {CrcPara} - 返回CRC参数
   * @throws {Error} - 如果CRC(SUM)模式缺少CrcLen参数，抛出错误
   * @throws {Error} - 如果placeIndex的索引范围超过128，抛出错误
   */
  private getCrcPara(option: CrcOption, ebBuffer: EBBuffer): CrcPara {
    let buffer = ebBuffer.getBuffer();
    let Mode = option.Mode;
    let CrcLen = 2;
    let Poly;
    let LittleEndian = option.LittleEndian ?? true;

    if (option.Mode == CrcMode.SUM) {
      if (option.CrcLen == null) {
        throw new Error(`CRC(SUM) verification is missing CrcLen parameter`);
      }
      CrcLen = option.CrcLen;
    }

    if (option.Mode == CrcMode.CRC16) {
      Poly = option.Poly || "a001";
    } else if (option.Mode == CrcMode.CCITT16) {
      Poly = option.Poly || "1021";
    }

    let PlaceInvert = true;
    let PlaceIdx = CrcLen - 1;
    if (option?.placeIndex && option?.placeIndex < 0) {
      PlaceInvert = true;
      PlaceIdx = Math.abs(option.placeIndex + 1);
    } else if (option?.placeIndex && option?.placeIndex >= 0) {
      PlaceInvert = false;
      PlaceIdx = option?.placeIndex;
    }
    if (PlaceIdx > 0x7f) {
      throw new Error(
        `The distance between the first and last indices of placeIndex cannot be greater than 128`
      );
    }

    let checkRange = {
      startIndex: 0,
      endIndex: 0 - CrcLen,
    };
    if (!option.crcCheckRange) {
      if (PlaceInvert == true) {
        checkRange.startIndex = 0;
        checkRange.endIndex = 0 - CrcLen;
      } else {
        checkRange.startIndex = CrcLen - 1;
        checkRange.endIndex = 0;
      }
    } else {
      checkRange = option.crcCheckRange;
    }

    let StartIdx = checkRange.startIndex;
    if (checkRange.startIndex < 0) {
      StartIdx = Math.abs(buffer.length + checkRange.startIndex);
    } else {
      StartIdx = checkRange.startIndex;
    }
    let EndIdx = 0;
    if (checkRange.endIndex < 0) {
      EndIdx = Math.abs(checkRange.endIndex);
    } else {
      EndIdx = buffer.length - 1 - checkRange.endIndex;
    }

    return {
      Mode,
      Poly,
      CrcLen,
      LittleEndian,
      StartIdx,
      EndIdx,
      PlaceIdx,
      PlaceInvert,
    };
  }

  /**
   * 设置查询CRC参数
   * @param {CrcOption} option - CRC选项
   * @returns {QueryEvent} - 返回当前对象
   */
  setQueryCrc(option: CrcOption): QueryEvent {
    this.queryCrcPara = this.getCrcPara(option, this.cmdBuffer);
    return this;
  }

  /**
   * 设置确认CRC参数
   * @param {CrcOption} option - CRC选项
   * @returns {QueryEvent} - 返回当前对象
   */
  setAckCrc(option: CrcOption): QueryEvent {
    this.ackCrcPara = this.getCrcPara(option, this.ackBuffer);
    return this;
  }

  /**
   * 添加确认检查规则
   * @param {number} index - 检查索引
   * @param {number} verifyBytes - 验证字节
   * @returns {QueryEvent} - 返回当前对象
   */
  addAckCheckRule(index: number, verifyBytes: number): QueryEvent {
    let tag: string = verifyBytes.toString(16).padStart(2, "0").toUpperCase();
    let invert = false;
    if (index < 0) {
      invert = true;
      index = Math.abs(index + 1);
    } else {
      invert = false;
      index = index;
    }
    this.tagCheckList.push({
      tag,
      index,
      invert,
    });
    return this;
  }

  /**
   * 设置周期
   * @param {number} period - 周期值
   * @param {number} [offsetSecond] - 偏移秒数
   * @returns {this} - 返回当前对象
   */
  setPeriod(period: number, offsetSecond?: number): this {
    super.setPeriod(period);
    if (offsetSecond == null || offsetSecond === undefined) {
      this.fixedAcq = false;
      this.fixedMoment = 0;
    } else {
      this.fixedAcq = true;
      this.fixedMoment = offsetSecond;
    }
    return this;
  }

  toJSON() {

    return {
      
      ...super.toJSON(),
      queryPeriod: this.queryPeriod,
      ackBuffer: this.ackBuffer,
      cmdBuffer: this.cmdBuffer,
      tagChecklist: this.tagCheckList,
      ackCrcPara: this.ackCrcPara,
      queryCrcPara: this.queryCrcPara,
      caculist: this.caculist,
      copyList: this.copyList
    };
  }
}