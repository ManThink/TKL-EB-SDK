import { EBBuffer } from "./EBBuffer";
import { CrcMode, CrcPosition, ExprCondition } from "./EBEnum";
import { LoraUpEvent } from "./Event/LoraUpEvent";
import { QueryEvent } from "./Event/QueryEvent";
import { Buffer } from "buffer";

/**
 * ALL_VARIABLE 类，用于定义全局常量。
 * 这些常量通常用于限制缓冲区的大小或其他全局配置。
 */
export class ALL_VARIABLE {
  /**
   * @deprecated 此变量为保留字段，不建议使用。
   * APPSTS 缓冲区的最大长度。
   */
  static APPSTS_MAX_LENGTH: number = 32;

  /**
   * @deprecated 此变量为保留字段，不建议使用。
   * APP 缓冲区的最大长度。
   */
  static APP_MAX_LENGTH: number = 255;

  /**
   * TEMP 缓冲区的最大长度。
   */
  static TEMP_MAX_LENGTH: number = 128;

  /**
   * UP 缓冲区的最大长度。
   */
  static UP_MAX_LENGTH: number = 1024;

  /**
   * ACK 缓冲区的最大长度。
   */
  static ACK_MAX_LENGTH: number = 1024;
}

/**
 * @description EBModel 类，用于管理 LoRa 上行事件和查询事件。提供添加事件、获取事件数量以及生成 JSON 格式数据的功能。
 */
export class EBModel {
  private LoraUpEventList: Array<LoraUpEvent> = []; // LoRa 上行事件列表
  private QueryEventList: Array<QueryEvent> = []; // 查询事件列表

  /**
   * 获取当前 LoRa 上行事件的数量。
   * @returns {number} - 返回 LoRa 上行事件的数量。
   */
  constructor() {
    
  }
  getLoraUpEventCount(): number {
    return this.LoraUpEventList.length;
  }

  /**
   * 添加事件到事件列表中。
   * @param {LoraUpEvent | QueryEvent} event - 要添加的事件，可以是 LoRa 上行事件或查询事件。
   * @throws {Error} - 如果事件名称为空或事件类型不匹配，抛出错误。
   */
  public addEvent(event: LoraUpEvent | QueryEvent): void {
    const eventName = event?.getName();
    if (!eventName) {
      throw Error(`请初始化事件名称`);
    }
    if ([LoraUpEvent.name, QueryEvent.name].includes(event.constructor.name)) {
      if (event instanceof LoraUpEvent) {
        this.LoraUpEventList.push(event)
      } else if (event instanceof QueryEvent){
        this.QueryEventList.push(event);
      }
    } else {
      throw Error("实例类型不匹配，请使用 LoraUpEvent 或 QueryEvent");
    }
  }

  /**
   * 将当前事件列表转换为 JSON 格式。
   * @returns {Object} - 返回包含 LoRa 上行事件和查询事件的 JSON 对象。
   */
  public toJSON(): object {
    return {
      binopt: {
        loraUpEventlist: [
          ...this.LoraUpEventList,
        ],
        queryEventlist: [
          ...this.QueryEventList,
        ],
      },
    };
  }
}


export function eb_compiler_pre_generated_json (ebModel:EBModel) {
  // Basic Variable Initialization
  const APP = new EBBuffer("app", Buffer.alloc(255));
  const APP_STATUS = new EBBuffer("appsts", Buffer.alloc(32));
  const SENSOR_DATA = new EBBuffer("sensor", Buffer.alloc(128));
  const TEMPLATE = new EBBuffer("temp", Buffer.alloc(128));
  const DEVICE_STATUS = new EBBuffer("db", Buffer.alloc(16));
  const DeviceBatteryVoltage = DEVICE_STATUS.readUint8(3);
  const isQueryTimeOut = APP_STATUS.readUint8(2).bitwiseAnd(2).rightShift(1);

  // Custom Code
  // Initialize all buffers: eg: txBuffer, cmdBuffer, ackBuffer
  let txBuffer1 = Buffer.from([0x81,0x21,0x3,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0])
  let txBuffer2 = Buffer.from([0x21,0x05,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00]);
  let ackBuffer = Buffer.from([0x01, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  let cmdBuffer = Buffer.from([0x01, 0x03, 0x00, 0x59, 0x00, 0x02, 0x14, 0x18])

  // Initialize query events and Lora's message uplink events
  // query event
  let queryEvent1 = new QueryEvent("query1", {
    cmdBuffer,
    ackBuffer,
  }).setAckCrc({
    Mode: CrcMode.CRC16
  }).setQueryCrc({
    Mode: CrcMode.CRC16,
  }).setPeriod(1000);
  
  // lora up event
  let loraUpEvent1 = new LoraUpEvent("up1", {
    txPort: 11,
    txBuffer: txBuffer1,
  });
  
  let loraUpEvent2 = new LoraUpEvent("up2", {
    txPort: 12,
    txBuffer: txBuffer2
  });

  // Generate expression
  let expr1 = loraUpEvent1.txBuffer.copyFrom({
    buffer: APP,
    bufferOffset: 25,
    byteLength: 2
  }, 6)

  let value = queryEvent1.ackBuffer.readUintLE(0,2).multiply(TEMPLATE.readUintLE(0, 2).divide(100));
  let expr2 = loraUpEvent2.txBuffer.writeUintLE(value, 16, 2);

  // Add expressions to event tasks
  queryEvent1.pushEBData(expr1);
  queryEvent1.pushEBData(expr2, {
    condition: ExprCondition.ONTIME
  })

  return JSON.stringify(ebModel, null, 2)
}

// const ebModel = new EBModel();
// QueryEvent.ebModel = ebModel;
// LoraUpEvent.ebModel = ebModel;
// console.log(eb_compiler_pre_generated_json(ebModel))

