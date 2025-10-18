
import { Buffer } from "buffer";
import { buildOtaFile } from "@EBSDK/run";
import { CrcMode, EBBuffer, EBModel, ExprCondition, LoraUpEvent, QueryEvent } from "@EBSDK/EBCompiler/all_variable";
import { CheckbitEnum, getOtaConfig, HwTypeEnum, UpgrdTypeEnum } from "@EBSDK/otaConfig";


let otaConfig = getOtaConfig({
  UpgrdType: UpgrdTypeEnum.GW,
  HwType: HwTypeEnum.OM422, //CN470和EN470 用OM422，其他都用OM822
  BaudRate: 19200,
  StopBits: 1,
  DataBits: 8,
  Checkbit: CheckbitEnum.NONE,
  Battery: true,
  ConfirmDuty: 60,
  BzType: null, // 必填项
  BzVersion: null // 必填项
})
const MODBUS_TT = (ebModel: EBModel) => {
  const APP = new EBBuffer("app", Buffer.alloc(255));
  const APP_STATUS = new EBBuffer("appsts", Buffer.alloc(32));
  const SENSOR_DATA = new EBBuffer("sensor", Buffer.alloc(128));
  const TEMPLATE = new EBBuffer("temp", Buffer.alloc(128));
  const DEVICE_STATUS = new EBBuffer("ds", Buffer.alloc(16));
///////////////////////////////////////////////////////////////////////////////
  // @ts-ignore
  let heartTxBuffer=Buffer.from("812103000000000000000000000000000000000000000000000000".replaceAll(" ", ""), "hex")
  //默认485地址为 15=0x0F
  //1. 读取电压电流和功率
  //2.为输入寄存器,功能码=0x04
  // 3.0x100A起始地址，读取36（0x0024）个寄存器，18个数据项的值，共72字节。查看对应的说明书
  // @ts-ignore
  let cmdBuffer1=Buffer.from("0F 04 10 0A 00 24 D5 FD".replaceAll(" ", ""), "hex")
  //回复的数据格式 地址=0x0F，功能码=0x04，字节数=0x48,寄存器值（18个Dword，72bytes），CRC16
  let ackBuffer1= Buffer.alloc(77) //3字节帧头（0x0F 0x04 0x48），72字节数据，2字节CRC16
  //默认485地址为 15=0x0F
  //1. 读取电量，正向有功电能，反向有功电能，总有功电能，净有功电能
  //2.为输入寄存器,功能码=0x04
  //3.0x1058起始地址，读取8（0x0008）个寄存器，4个数据项的值，共16字节。
  // @ts-ignore
  let cmdBuffer2=Buffer.from("0F 04 10 58 00 08 75 F1".replaceAll(" ", ""), "hex")
  //回复的数据格式 地址=0x0F，功能码=0x04，字节数=0x08,寄存器值（4个Dword，16bytes），CRC16
  let ackBuffer2= Buffer.alloc(21) //3字节帧头（0x0F 0x04 0x10），16字节数据，2字节CRC16

  //只有一个上行事件，将两个查询数据打包成一个上行数据帧
  let txBuffer1=Buffer.alloc(91) //数据标识，超时标志位1，超时标志位2，电压、电流、功率、电量，总共 91字节
  txBuffer1[0]=0x01 //数据标识

  const DeviceBatteryVoltage = DEVICE_STATUS.readUint8(3);
  // 最近一次查询事件是否超时判断
  const isQueryTimeOut = APP_STATUS.readUint8(2).bitwiseAnd(2).rightShift(1);
  // 默认的节点上行心跳周期，单位秒,默认周期 一天=86400秒
  let heartLoraUpEvent = new LoraUpEvent("heart", {
    txBuffer: heartTxBuffer,
    txPort: 61
  }).setPeriod(86400)
  heartLoraUpEvent.pushEBData(heartLoraUpEvent.txBuffer.copyFrom({
    bufferOffset: 0,  
    byteLength: 24,
    buffer: APP
  }, 3))

  // ---------------------------------------------------
  //LoRa 周期性上报数据，周期 单位秒，以下示例 300秒
  let upEvent1 = new LoraUpEvent("upEvent1", {
    txBuffer:  txBuffer1,
    txPort: 12
  }).setPeriod(300)
  // 查询事件1，周期 单位秒，以下示例 300秒
  let quEvent1 = new QueryEvent("quEvent1", {
    cmdBuffer: cmdBuffer1,
    ackBuffer: ackBuffer1,
  }).setPeriod(300)
  quEvent1.pushEBData(upEvent1.txBuffer.writeUint8(isQueryTimeOut, 1))
  // 计算发送数据的crc校验和
  quEvent1.setQueryCrc({
    Mode: CrcMode.CRC16,
    placeIndex:6,
    LittleEndian:true,
    crcCheckRange:{
      startIndex:0,
      endIndex:cmdBuffer1.length-3
    }
  })
  quEvent1.addAckCheckRule(0,cmdBuffer1[0]) //检查回复的的485地址是否正确，避免总线其他回复带来串扰
  quEvent1.addAckCheckRule(1,cmdBuffer1[1]) //检查功能码
  quEvent1.addAckCheckRule(2,ackBuffer1.length-5) //检查回复的数据长度是否正确
  //检查回复数据的校验和
  quEvent1.setAckCrc({
    Mode: CrcMode.CRC16,
    placeIndex:6,
    LittleEndian:true,
    crcCheckRange:{
      startIndex:0,
      endIndex:ackBuffer1.length-3
    }
  })
  //查询事件1，回复数据处理，将查询到的数据copy到上行数据中,第3字节copy到上行buffer的第3字节开始
  quEvent1.pushEBData(upEvent1.txBuffer.copyFrom({
      bufferOffset: 3,
      byteLength: 72,
      buffer: quEvent1.ackBuffer
    }, 3),{
      condition: ExprCondition.ONTIME
    })
  // 查询事件2，周期 单位秒，以下示例 300秒
  let quEvent2 = new QueryEvent("quEvent2", {
    cmdBuffer: cmdBuffer2,
    ackBuffer: ackBuffer2,
  }).setPeriod(300)
  quEvent2.pushEBData(upEvent1.txBuffer.writeUint8(isQueryTimeOut, 2))
  // 计算发送数据的crc校验和
  quEvent2.setQueryCrc({
    Mode: CrcMode.CRC16,
    placeIndex:6,
    LittleEndian:true,
    crcCheckRange:{
      startIndex:0,
      endIndex:cmdBuffer2.length-3
    }
  })
  quEvent2.addAckCheckRule(0,cmdBuffer2[0]) //检查回复的的485地址是否正确，避免总线其他回复带来串扰
  quEvent2.addAckCheckRule(1,cmdBuffer2[1]) //检查功能码
  quEvent2.addAckCheckRule(2,ackBuffer2.length-5) //检查回复的数据长度是否正确
  //检查回复数据的校验和
  quEvent2.setAckCrc({
    Mode: CrcMode.CRC16,
    placeIndex:6,
    LittleEndian:true,
    crcCheckRange:{
      startIndex:0,
      endIndex:ackBuffer2.length-3
    }
  })
  //查询事件1，回复数据处理，将查询到的数据copy到上行数据中的到第75个字节开始
  quEvent2.pushEBData(upEvent1.txBuffer.copyFrom({
    bufferOffset: 3,
    byteLength: 16,
    buffer: quEvent2.ackBuffer
  }, 75),{
      condition: ExprCondition.ONTIME
    })
  // ----------------------------------------------------
  return JSON.stringify(ebModel, null, 2)
}

function main() {
  return buildOtaFile(__filename, otaConfig, MODBUS_TT)
}

main()