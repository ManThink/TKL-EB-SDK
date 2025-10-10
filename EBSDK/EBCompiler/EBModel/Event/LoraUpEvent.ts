import { EBBuffer } from "../EBBuffer";
import { EBModel } from "../EBModel";
import { UpEventType } from "../EBEnum";
import { BaseEvent } from "./BaseEvent";
import { Buffer } from "buffer";

/**
 * LoraUpEvent类，用于表示LoRa上行事件
 */
export class LoraUpEvent extends BaseEvent {
  static ebModel: EBModel | null = null; // 静态属性，用于存储EBModel实例

  public readonly txBuffer: EBBuffer; // 发送缓冲区
  public index!: number; // 事件索引
  public txPort: number; // 发送端口
  private type: UpEventType; // 事件类型

  /**
   * 构造函数
   * @param {string} name - 事件名称
   * @param {Object} options - 事件配置
   * @param {Buffer} options.txBuffer - 发送缓冲区
   * @param {number} options.txPort - 发送端口
   * @param {UpEventType} [options.type=UpEventType.NORMAL] - 事件类型，默认为NORMAL
   * @throws {Error} - 如果未设置LoRaUpEvent.ebModel，抛出错误
   */
  constructor(
    name: string,
    {
      txBuffer,
      txPort,
      type = UpEventType.NORMAL,
    }: {
      txBuffer: Buffer;
      txPort: number;
      type?: UpEventType;
    }
  ) {
    if (!LoraUpEvent.ebModel) {
      throw new Error(
        'LoRaUpEvent.ebModel is not set, please use "LoRaUpEvent.ebModel = ebModel" code for initialization'
      );
    }
    super(name);
    let index = LoraUpEvent.ebModel?.getLoraUpEventCount();
    this.txBuffer = new EBBuffer(`up[${index}]`, txBuffer);
    this.txPort = txPort;
    this.type = type;
    LoraUpEvent.ebModel?.addEvent(this);
  }

  /**
   * 将事件对象转换为JSON格式
   * @returns {Object} - 返回包含事件属性的JSON对象
   */
  toJSON() {
    return {
      ...super.toJSON(),
      periodMode: this.queryPeriod,
      type: this.type,
      txPort: this.txPort,
      txBuffer: this.txBuffer
    };
  }
}