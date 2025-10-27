
import { Buffer } from "buffer";
import { buildOtaFile } from "@EBSDK/run";
import { CrcMode, EBBuffer, EBModel, ExprCondition, LoraUpEvent, QueryEvent } from "@EBSDK/EBCompiler/all_variable";
import { CheckbitEnum, getOtaConfig, HwTypeEnum, UpgrdTypeEnum } from "@EBSDK/otaConfig";


let otaConfig = getOtaConfig({
  UpgrdType: UpgrdTypeEnum.GW,
  HwType: HwTypeEnum.OM822, // CN470 and EN470 used OM422 otherwise is OM822
  BaudRate: 19200,
  StopBits: 1,
  DataBits: 8,
  Checkbit: CheckbitEnum.NONE,
  Battery: false,
  ConfirmDuty: 60,
  BzType: 301, // required ,2 bytes
  BzVersion: 12 // required,1 bytes
})
const MODBUS_TT = (ebModel: EBModel) => {
  const APP = new EBBuffer("app", Buffer.alloc(255));
  const APP_STATUS = new EBBuffer("appsts", Buffer.alloc(32));
  const SENSOR_DATA = new EBBuffer("sensor", Buffer.alloc(128));
  const TEMPLATE = new EBBuffer("temp", Buffer.alloc(128));
  const DEVICE_STATUS = new EBBuffer("ds", Buffer.alloc(16));
///////////////////////////////////////////////////////////////////////////////
  let heartTxBuffer=Buffer.from("8121030304050607080910111213141516171819".replaceAll(" ", ""), "hex")
  let heartLoraUpEvent = new LoraUpEvent("heart", {
    txBuffer: heartTxBuffer,
    txPort: 61
  }).setPeriod(86400) // default period is 1 day to keep alive with ThinkLink
  //copy parameters from APP para which can help to check the version and configuration of the device
  // reference file:https://mensikeji.yuque.com/staff-zesscp/gqdw7f/wi7zpgc14t6cfl9g?singleDoc#
  //copy 7 bytes to heart which including BzType and BzVersion for ThinkLink to check the result of EB upgrade
  heartLoraUpEvent.pushEBData(heartLoraUpEvent.txBuffer.copyFrom({
    bufferOffset: 0,
    byteLength: 7,
    buffer: APP
  }, 3))
  // copy 3 bytes which defined Chip Temperature and Battery voltage
  heartLoraUpEvent.pushEBData(heartLoraUpEvent.txBuffer.copyFrom({
    bufferOffset: 29,
    byteLength: 3,
    buffer: APP
  }, 10))
  // copy 7 bytes which including the heart period and the device counts of multi sub devices
  heartLoraUpEvent.pushEBData(heartLoraUpEvent.txBuffer.copyFrom({
    bufferOffset: 58,
    byteLength: 7,
    buffer: APP
  }, 13))
  // Default 485 address is 15=0x0F
  // 1. Read voltage, current, and power
  // 2. Input register, function code=0x04
  // 3. Starting address 0x100A, read 36 (0x0024) registers, 18 data items, total 72 bytes. Refer to the corresponding manual.
  let cmdBuffer1=Buffer.from("0F 04 10 0A 00 24 D5 FD".replaceAll(" ", ""), "hex")
  // Reply data format: Address=0x0F, Function Code=0x04, Byte Count=0x48, Register values (18 Dwords, 72 bytes), CRC16
  let ackBuffer1= Buffer.alloc(77) // 3-byte frame header (0x0F 0x04 0x48), 72 bytes of data, 2 bytes of CRC16
  // Default 485 address is 15=0x0F
  // 1. Read electricity, forward active energy, reverse active energy, total active energy, net active energy
  // 2. Input register, function code=0x04
  // 3. Starting address 0x1058, read 8 (0x0008) registers, 4 data items, total 16 bytes.
  // @ts-ignore
  let cmdBuffer2=Buffer.from("0F 04 10 58 00 08 75 F1".replaceAll(" ", ""), "hex")
  // Reply data format: Address=0x0F, Function Code=0x04, Byte Count=0x08, Register values (4 Dwords, 16 bytes), CRC16
  let ackBuffer2= Buffer.alloc(21) // 3-byte frame header (0x0F 0x04 0x10), 16 bytes of data, 2 bytes of CRC16

  // Only one uplink event, packing two query data into one uplink data frame
  let txBuffer1=Buffer.alloc(91) // Data identifier, timeout flag 1, timeout flag 2, voltage, current, power, electricity, total 91 bytes
  txBuffer1[0]=0x01 // Data identifier

  const DeviceBatteryVoltage = DEVICE_STATUS.readUint8(3);
  // Check if the last query event timed out
  const isQueryTimeOut = APP_STATUS.readUint8(2).bitwiseAnd(2).rightShift(1);
  // ---------------------------------------------------
  // LoRa periodic data reporting, period in seconds, example 300 seconds
  let upEvent1 = new LoraUpEvent("upEvent1", {
    txBuffer:  txBuffer1,
    txPort: 12
  }).setPeriod(300)
  // Query event 1, period in seconds, example 300 seconds
  let quEvent1 = new QueryEvent("quEvent1", {
    cmdBuffer: cmdBuffer1,
    ackBuffer: ackBuffer1,
  }).setPeriod(300)
  quEvent1.pushEBData(upEvent1.txBuffer.writeUint8(isQueryTimeOut, 1))
  // Calculate CRC checksum for sent data
  quEvent1.setQueryCrc({
    Mode: CrcMode.CRC16,
    placeIndex:6,
    LittleEndian:true,
    crcCheckRange:{
      startIndex:0,
      endIndex:cmdBuffer1.length-3
    }
  })
  quEvent1.addAckCheckRule(0,cmdBuffer1[0]) // Check if the reply's 485 address is correct to avoid interference from other replies on the bus
  quEvent1.addAckCheckRule(1,cmdBuffer1[1]) // Check function code
  quEvent1.addAckCheckRule(2,ackBuffer1.length-5) // Check if the reply data length is correct
  // Check CRC checksum for reply data
  quEvent1.setAckCrc({
    Mode: CrcMode.CRC16,
    placeIndex:6,
    LittleEndian:true,
    crcCheckRange:{
      startIndex:0,
      endIndex:ackBuffer1.length-3
    }
  })
  // Query event 1, reply data processing, copy the queried data to the uplink data, starting from the 3rd byte of the uplink buffer
  quEvent1.pushEBData(upEvent1.txBuffer.copyFrom({
    bufferOffset: 3,
    byteLength: 72,
    buffer: quEvent1.ackBuffer
  }, 3),{
    condition: ExprCondition.ONTIME
  })
  // Query event 2, period in seconds, example 300 seconds
  let quEvent2 = new QueryEvent("quEvent2", {
    cmdBuffer: cmdBuffer2,
    ackBuffer: ackBuffer2,
  }).setPeriod(300)
  quEvent2.pushEBData(upEvent1.txBuffer.writeUint8(isQueryTimeOut, 2))
  // Calculate CRC checksum for sent data
  quEvent2.setQueryCrc({
    Mode: CrcMode.CRC16,
    placeIndex:6,
    LittleEndian:true,
    crcCheckRange:{
      startIndex:0,
      endIndex:cmdBuffer2.length-3
    }
  })
  quEvent2.addAckCheckRule(0,cmdBuffer2[0]) // Check if the reply's 485 address is correct to avoid interference from other replies on the bus
  quEvent2.addAckCheckRule(1,cmdBuffer2[1]) // Check function code
  quEvent2.addAckCheckRule(2,ackBuffer2.length-5) // Check if the reply data length is correct
  // Check CRC checksum for reply data
  quEvent2.setAckCrc({
    Mode: CrcMode.CRC16,
    placeIndex:6,
    LittleEndian:true,
    crcCheckRange:{
      startIndex:0,
      endIndex:ackBuffer2.length-3
    }
  })
  // Query event 1, reply data processing, copy the queried data to the uplink data, starting from the 75th byte of the uplink buffer
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

buildOtaFile(__filename, otaConfig, MODBUS_TT)