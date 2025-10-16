import { EBModel } from "@EBSDK/EBCompiler/EBModel/EBModel";
import { CrcMode, EBBuffer, ExprCondition, LoraUpEvent, QueryEvent } from "@EBSDK/EBCompiler/all_variable";
import { Buffer } from "buffer";

export const SE_QueryAndLoraUp = (ebModel: EBModel) => {
  // 初始化缓冲区
  const APP = new EBBuffer("app", Buffer.alloc(255));
  const APP_STATUS = new EBBuffer("appsts", Buffer.alloc(32));
  const SENSOR_DATA = new EBBuffer("sensor", Buffer.alloc(128));
  const TEMPLATE = new EBBuffer("temp", Buffer.alloc(128));
  const DEVICE_STATUS = new EBBuffer("db", Buffer.alloc(16));
  const DeviceBatteryVoltage = DEVICE_STATUS.readUint8(3);
  const isQueryTimeOut = APP_STATUS.readUint8(2).bitwiseAnd(2).rightShift(1);

  // 定义LoRa上行事件
  let heartLoraUpEvent = new LoraUpEvent("heart", {
    txPort: 61,
    txBuffer: Buffer.from([0x81, 0x21, 0x3, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0]),
  });

  // 将APP缓冲区的部分数据复制到LoRa上行事件的txBuffer中
  heartLoraUpEvent.pushEBData(heartLoraUpEvent.txBuffer.copyFrom({
    buffer: APP,
    bufferOffset: 52,
    byteLength: 8
  }, 3));

  heartLoraUpEvent.pushEBData(heartLoraUpEvent.txBuffer.copyFrom({
    buffer: APP,
    bufferOffset: 61,
    byteLength: 4
  }, 11));

  // 定义查询事件
  let MeterDataQuery = new QueryEvent("Qu_Meter", {
    cmdBuffer: Buffer.from([0x01, 0x03, 0x00, 0x06, 0x00, 0x32, 0x00, 0x00]), // 查询一次电网数据
    ackBuffer: Buffer.alloc(68) // 根据cmdBuffer指令确定ackBuffer长度
  }).setAckCrc({
    Mode: CrcMode.CRC16,
    Poly: "a001",
    LittleEndian: true,
    placeIndex: -2,
  }).setQueryCrc({
    Mode: CrcMode.CRC16,
  }).setPeriod(300).addAckCheckRule(1, 0x03).addAckCheckRule(2, 0x06);

  // 将查询到的数据处理后写入LoRa上行事件的txBuffer中
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(6), 10), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(10), 14), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(14), 18), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(18), 22), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(22), 26), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(26), 30), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(30), 34), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(34), 38), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(38), 42), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(42), 46), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(46), 50), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(50), 54), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(54), 58), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(58), 62), {
    condition: ExprCondition.ONTIME
  });
  MeterDataQuery.pushEBData(heartLoraUpEvent.txBuffer.writeFloatLE(MeterDataQuery.ackBuffer.readFloatLE(62), 66), {
    condition: ExprCondition.ONTIME
  });

  return JSON.stringify(ebModel, null, 2);
}

export function run_PD194E_PHY_QueryAndLoraUp() {
  const ebModel = new EBModel();
  QueryEvent.ebModel = ebModel;
  LoraUpEvent.ebModel = ebModel;
  new LoraUpEvent("random", {
    txBuffer: Buffer.from([130]),
    txPort: 11
  }).setPeriod(345600000);
  new QueryEvent("random", {
    cmdBuffer: Buffer.from([]),
    ackBuffer: Buffer.from([]),
  }).setPeriod(345600000)
  console.log(JSON.parse(SE_QueryAndLoraUp(ebModel)));
}