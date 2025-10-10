
import { Buffer } from "buffer";
import { buildOtaFile } from "../../EBSDK/run";
import { CrcMode, EBBuffer, EBModel, ExprCondition, LoraUpEvent, QueryEvent } from "../../EBSDK/EBCompiler/all_variable";
import { CheckbitEnum, getOtaConfig, HwTypeEnum, UpgrdTypeEnum } from "../../EBSDK/otaConfig";


let otaConfig = getOtaConfig({
  UpgrdType: UpgrdTypeEnum.GW,
  HwType: HwTypeEnum.OM422, //CN470和EN470 用OM422，其他都用OM822
  BaudRate: 2400,
  StopBits: 1,
  DataBits: 8,
  Checkbit: CheckbitEnum.NONE,
  Battery: false,
  ConfirmDuty: 60,
  BzType: 1, // 必填项
  BzVersion: 2 // 必填项
})
export const MODBUS_TT = (ebModel: EBModel) => {
  const APP = new EBBuffer("app", Buffer.alloc(255));
  const APP_STATUS = new EBBuffer("appsts", Buffer.alloc(32));
  const SENSOR_DATA = new EBBuffer("sensor", Buffer.alloc(128));
  const TEMPLATE = new EBBuffer("temp", Buffer.alloc(128));
  const DEVICE_STATUS = new EBBuffer("ds", Buffer.alloc(16));
///////////////////////////////////////////////////////////////////////////////
  // @ts-ignore
  let heartTxBuffer=Buffer.from("812103000000000000000000000000000000000000000000000000".replaceAll(" ", ""), "hex")
  //默认485地址为 1=0x01
  //1. 读取电压
  //2.为输入寄存器,功能码=0x03
  // 3.0x0000起始地址，读取6（0x0005）个寄存器，3个数据项的值，共12bytes。查看对应的说明书
  // @ts-ignore
  let cmdBuffer1=Buffer.from("01 03 00 00 00 06 C5 C8".replaceAll(" ", ""), "hex")
  //回复的数据格式 地址=0x01，功能码=0x03，字节数=0x0c,寄存器值（3个Dword，12bytes），CRC16
  let ackBuffer1= Buffer.alloc(17) //3字节帧头（0x01 0x03 0x0c），12字节数据，2字节CRC16
  
//   //默认485地址为 1=0x01
//   //1. 读取电流
//   //2.为输入寄存器,功能码=0x03
//   //3.0x0010起始地址，读取6（0x0015）个寄存器，3个数据项的值，共12bytes。
//   // @ts-ignore
  let cmdBuffer2=Buffer.from("01 03 00 10 00 30 1B 44".replaceAll(" ", ""), "hex")
  //回复的数据格式 地址=0x01，功能码=0x03，字节数=0x0c,寄存器值（3个Dword，12bytes），CRC16
  let ackBuffer2= Buffer.alloc(101) //3字节帧头（0x01 0x03 0x0c），12字节数据，2字节CRC16
  
//   //默认485地址为 01=0x01
//   //1. 读取功率
//   //2.为输入寄存器,功能码=0x03
//   //3.0x0040起始地址，读取6（0x0045）个寄存器，3个数据项的值，共12字节。
//   // @ts-ignore
//   let cmdBuffer3=Buffer.from("01 03 00 40 00 06 C4 1C".replaceAll(" ", ""), "hex")
//   //回复的数据格式 地址=0x01，功能码=0x03，字节数=0x0c,寄存器值（3个Dword，12bytes），CRC16
//   let ackBuffer3= Buffer.alloc(17) //3字节帧头（0x01 0x03 0x0c），12字节数据，2字节CRC16

//   //默认485地址为 01=0x01
//   //1. 读取电量
//   //2.为输入寄存器,功能码=0x03
//   //3.0x0070起始地址，读取6（0x0075）个寄存器，3个数据项的值，共12字节。
//   // @ts-ignore
//   let cmdBuffer4=Buffer.from("01 03 00 70 00 06 C4 13".replaceAll(" ", ""), "hex")
//   //回复的数据格式 地址=0x01，功能码=0x03，字节数=0x0c,寄存器值（3个Dword，12bytes），CRC16
//   let ackBuffer4= Buffer.alloc(17) //3字节帧头（0x01 0x03 0x0c），12字节数据，2字节CRC16


  //只有一个上行事件，将两个查询数据打包成一个上行数据帧
  let txBuffer1=Buffer.alloc(9) //数据标识，超时标志位1，超时标志位2，电压、电流、功率、电量，总共 51字节
  txBuffer1[0]=0x01 //电压

  let txBuffer2=Buffer.alloc(99) //数据标识，超时标志位1，超时标志位2，电压、电流、功率、电量，总共 51字节
  txBuffer2[0]=0x02 //电流

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
  //LoRa 周期性上报数据，周期 单位秒，以下示例 60秒
  let upEvent1 = new LoraUpEvent("upEvent1", {
    txBuffer:  txBuffer1,
    txPort: 12
  }).setPeriod(60)

  let upEvent2 = new LoraUpEvent("upEvent2", {
    txBuffer:  txBuffer2,
    txPort: 12
  }).setPeriod(60)

  // 查询事件1，周期 单位秒，以下示例 60秒
  let quEvent1 = new QueryEvent("quEvent1", {
    cmdBuffer: cmdBuffer1,
    ackBuffer: ackBuffer1,
  }).setPeriod(60)
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
    placeIndex:-2,
    LittleEndian:true,
    crcCheckRange:{
      startIndex:0,
      endIndex:ackBuffer1.length-3
    }
  })
  //查询事件1，查询到的电压原始数据4Byte,我们正常的电压2个Byte足够表示，下面函数精简了电压值
  for (let i = 0; i < 3; i++) {
    quEvent1.pushEBData(
      upEvent1.txBuffer.copyFrom({
      bufferOffset: 3 + i * 4,  
      byteLength: 2,
      buffer: quEvent1.ackBuffer
      }, 3 + i * 2),
      {
        condition: ExprCondition.ONTIME
      }
      );
  }

  // 查询事件2，周期 单位秒，以下示例 60秒
  let quEvent2 = new QueryEvent("quEvent2", {
    cmdBuffer: cmdBuffer2,
    ackBuffer: ackBuffer2,
  }).setPeriod(60)
//   quEvent2.pushEBData(upEvent1.txBuffer.writeUint8(isQueryTimeOut, 2))
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
    placeIndex:-2,
    LittleEndian:true,
    crcCheckRange:{
      startIndex:0,
      endIndex:ackBuffer2.length-3
    }
  })
//   quEvent2.pushEBData(
//     upEvent2.txBuffer.copyFrom({
//     bufferOffset: 3,
//     byteLength: 96,
//     buffer: quEvent2.ackBuffer
//     }, 3),{
//       condition: ExprCondition.ONTIME
//   })  
  //查询事件1，回复数据处理，将查询到的数据copy到上行数据中的到第15个字节开始

  // for (let i = 0; i < 20; i++) {
  //   quEvent2.pushEBData(upEvent2.txBuffer.copyFrom({
  //       bufferOffset: 3 + i * 4,
  //       byteLength: 2,
  //       buffer: quEvent2.ackBuffer
  //   }, 3 + i * 2),{
  //       condition: ExprCondition.ONTIME,
  //   })
  // }

  quEvent2.pushEBData(
    upEvent2.txBuffer.writeInt32BE(
      quEvent2.ackBuffer.readInt32BE(3).bitwiseAnd(65535), 3),
    {
      condition: ExprCondition.ONTIME,
      Repeat: 20
    }
  )

  // ----------------------------------------------------
//   let quEvent3 = new QueryEvent("quEvent3", {
//     cmdBuffer: cmdBuffer3,
//     ackBuffer: ackBuffer3,
//   }).setPeriod(240)
//   quEvent3.pushEBData(upEvent1.txBuffer.writeUint8(isQueryTimeOut, 2))
//   // 计算发送数据的crc校验和
//   quEvent3.setQueryCrc({
//     Mode: CrcMode.CRC16,
//     placeIndex:6,
//     LittleEndian:true,
//     crcCheckRange:{
//       startIndex:0,
//       endIndex:cmdBuffer3.length-3
//     }
//   })
//   quEvent3.addAckCheckRule(0,cmdBuffer3[0]) //检查回复的的485地址是否正确，避免总线其他回复带来串扰
//   quEvent3.addAckCheckRule(1,cmdBuffer3[1]) //检查功能码
//   quEvent3.addAckCheckRule(2,ackBuffer3.length-5) //检查回复的数据长度是否正确
//   //检查回复数据的校验和
//   quEvent3.setAckCrc({
//     Mode: CrcMode.CRC16,
//     placeIndex:-2,
//     LittleEndian:true,
//     crcCheckRange:{
//       startIndex:0,
//       endIndex:ackBuffer3.length-3
//     }
//   })
//   //查询事件1，回复数据处理，将查询到的数据copy到上行数据中的到第27个字节开始
//   quEvent3.pushEBData(upEvent1.txBuffer.copyFrom({
//     bufferOffset: 3,
//     byteLength: 12,
//     buffer: quEvent3.ackBuffer
//   }, 27),{
//       condition: ExprCondition.ONTIME
//     })
//   // ----------------------------------------------------

//   let quEvent4 = new QueryEvent("quEvent4", {
//     cmdBuffer: cmdBuffer4,
//     ackBuffer: ackBuffer4,
//   }).setPeriod(240)
//   quEvent4.pushEBData(upEvent1.txBuffer.writeUint8(isQueryTimeOut, 2))
//   // 计算发送数据的crc校验和
//   quEvent4.setQueryCrc({
//     Mode: CrcMode.CRC16,
//     placeIndex:6,
//     LittleEndian:true,
//     crcCheckRange:{
//       startIndex:0,
//       endIndex:cmdBuffer4.length-3
//     }
//   })
//   quEvent4.addAckCheckRule(0,cmdBuffer4[0]) //检查回复的的485地址是否正确，避免总线其他回复带来串扰
//   quEvent4.addAckCheckRule(1,cmdBuffer4[1]) //检查功能码
//   quEvent4.addAckCheckRule(2,ackBuffer4.length-5) //检查回复的数据长度是否正确
//   //检查回复数据的校验和
//   quEvent4.setAckCrc({
//     Mode: CrcMode.CRC16,
//     placeIndex:-2,
//     LittleEndian:true,
//     crcCheckRange:{
//       startIndex:0,
//       endIndex:ackBuffer4.length-3
//     }
//   })
//   //查询事件1，回复数据处理，将查询到的数据copy到上行数据中的到第39个字节开始
//   quEvent4.pushEBData(upEvent1.txBuffer.copyFrom({
//     bufferOffset: 3,
//     byteLength: 12,
//     buffer: quEvent4.ackBuffer
//   }, 39),{
//       condition: ExprCondition.ONTIME
//     })
//   // ----------------------------------------------------

  return JSON.stringify(ebModel, null, 2)
}


buildOtaFile(__filename, otaConfig, MODBUS_TT)