import { EBBuffer } from "../EBBuffer";
import { EBModel } from "../EBModel";
import { CopyRule, CvtRule } from "../EBRule";
import { CrcMode, CrcPosition } from "../EBEnum";
import { CrcOption, CrcPara, PeriodValue, TagCheckProp } from "../interface";
import { BaseEvent } from "./BaseEvent";
import { Buffer } from "buffer";

/**
 * QueryEvent class, used to represent a query event.
 */
export class QueryEvent extends BaseEvent {
  /** Static property to store the EBModel instance. */
  static ebModel: EBModel | null = null; 

  /**
   * Buffer for downstream meter reading commands.
   */
  public cmdBuffer: EBBuffer = new EBBuffer("cmd", Buffer.alloc(0));

  /**
   * Buffer for device response messages.
   */
  public ackBuffer: EBBuffer = new EBBuffer("ack", Buffer.alloc(0)); 
  
  /**
   * CRC parameters for verifying the ackBuffer integrity.
   */
  protected ackCrcPara!: CrcPara; 
  /**
   * CRC configuration for cmdBuffer command validation.
   */
  protected queryCrcPara!: CrcPara;
  /**
   * List of tag checks for verifying and matching command validation bytes.
   */
  protected tagCheckList: Array<TagCheckProp> = []; 


  /**
   * Whether to enable fixed-time acquisition.
   * If true, data is collected at regular time intervals based on the query cycle.
   */
  protected fixedAcq!: boolean; 
  /**
   * The second offset within the query cycle for fixed-time acquisition.
   * For example, with a 5-minute query cycle, acquisition occurs at second {fixedMoment} 
   * of every 5-minute interval (e.g., 00:00, 00:05, 00:10, etc.).
   */
  protected fixedMoment!: number; 

  /**
   * Start position identifier for one-to-many DTU query command grouping.
   */
  protected MulDev_NewGrpStart: boolean; 

  /**
   * 构造函数
   * @param {string} name - 事件名称
   * @param {Object} options - 事件配置
   * @param {Buffer} options.ackBuffer - 485设备返回的数据的缓存区
   * @param {Buffer} options.cmdBuffer - 下发给485设备的查询命令缓存区
   * @param {boolean} options.MulDev_NewGrpStart - 一带多DTU查询指令的分组起始位置标识.
   *  - 开启此标识后，DTU支持一带多设备通信
   *  - 仅需在新的查询分组开始时需要设置此标志位
   * @throws {Error} - 如果未设置QueryEvent.ebModel，抛出错误
   */
   /**
   * Constructor
   * @param {string} name The name of the event.
   * @param {Object} options Event configuration.
   * @param {Buffer} options.ackBuffer  options.ackBuffer The buffer for data returned by the 485 device.
   * @param {Buffer} options.cmdBuffer The buffer for the query command sent to the 485 device.
   * @param {boolean} options.MulDev_NewGrpStart Identifier for the start of a new group in a one-to-many DTU query command.
   *  - Enabling this flag allows the DTU to communicate with multiple devices.
   *  - This flag only needs to be set at the beginning of a new query group.
   * @throws {Error} If QueryEvent.ebModel is not set.
   */
  constructor(
    name: string,
    { ackBuffer, cmdBuffer, MulDev_NewGrpStart=false }: { ackBuffer: Buffer; cmdBuffer: Buffer; MulDev_NewGrpStart?:boolean}
  ) {
    if (!QueryEvent.ebModel) {
      throw new Error(
        'QueryEvent.ebModel is not set, please use "QueryEvent.ebModel = ebModel" code for initialization'
      );
    }
    super(name);
    this.ackBuffer = new EBBuffer(`ack`, ackBuffer);
    this.cmdBuffer = new EBBuffer(`cmd`, cmdBuffer);
    this.MulDev_NewGrpStart = !!MulDev_NewGrpStart;
    QueryEvent.ebModel?.addEvent(this);
  }


   /**
   * Gets the CRC parameters.
   * @param {CrcOption} option CrcOption.
   * @param {EBBuffer} ebBuffer The buffer.
   * @returns {CrcPara} The CRC parameters.
   * @throws {Error} If CrcLen is missing for CRC(SUM) mode.
   * @throws {Error} If the index range for placeIndex exceeds 128.
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
   * Sets the query CRC parameters.
   * @param {CrcOption} option CRC options.
   * @returns {QueryEvent} The current object (for chaining).
   */
  setQueryCrc(option: CrcOption): QueryEvent {
    this.queryCrcPara = this.getCrcPara(option, this.cmdBuffer);
    return this;
  }

 
  /**
   * Sets the acknowledgment CRC parameters.
   * @param {CrcOption} option CRC options.
   * @returns {QueryEvent} The current object (for chaining).
   */
  setAckCrc(option: CrcOption): QueryEvent {
    this.ackCrcPara = this.getCrcPara(option, this.ackBuffer);
    return this;
  }

 
  /**
   * Adds an acknowledgment check rule.
   * @param {number} index The check index.
   * @param {number} verifyBytes The verification byte (single-byte check value in decimal).
   * @returns {QueryEvent} this
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
   * Sets the period.
   * @param {number} period The period value.
   * @param {number} offsetSecond The offset in seconds (optional). 
   * - If provided, enables fixed-time acquisition with the specified offset;
   * - if omitted, disables fixed-time acquisition.
   * @returns The current object (for chaining).
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
      MulDev_NewGrpStart: this.MulDev_NewGrpStart,
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