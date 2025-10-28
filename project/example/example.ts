import {Buffer} from "buffer";
import {buildOtaFile} from "@EBSDK/run";
import {
    ActionAfertExpr,
    CrcMode,
    EBBuffer,
    EBModel,
    ExprCondition,
    LoraUpEvent,
    QueryEvent
} from "@EBSDK/EBCompiler/all_variable";
import {CheckbitEnum, getOtaConfig, HwTypeEnum, UpgrdTypeEnum} from "@EBSDK/otaConfig";

let otaConfig = getOtaConfig({
    UpgrdType: UpgrdTypeEnum.GW,
    HwType: HwTypeEnum.OM822, // CN470 and EN470 used OM422 otherwise is OM822
    BaudRate: 9600,
    StopBits: 1,
    DataBits: 8,
    Checkbit: CheckbitEnum.NONE,
    Battery: true,
    ConfirmDuty: 60,
    BzType: 101, // required ,2 bytes
    BzVersion: 2 // required,1 bytes
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
    // the Buffer which will be transmitted to sub device by UART/RS-485/M-Bus
    let cmdBuffer1=Buffer.from("12345678b1b2b3b4b5b6b7b8b9".replaceAll(" ", ""), "hex")
    // The expected message from the child device does not need to fully match the content, but its length should be greater than the actual reply.
    let ackBuffer1= Buffer.from("a1a2a3a4a5a6a7a8a9".replaceAll(" ",""),"hex")
    //build a query event with cmdBuffer1 and ackBuffer1, every 300 seconds, the cmdBuffer1 will be transmitted  and expecting ackBuffer1
    let quEvent1=new QueryEvent("quEvent1", {
        cmdBuffer: cmdBuffer1,
        ackBuffer: ackBuffer1,
        MulDev_NewGrpStart: true
    }).setPeriod(300)
    // EB will cacu the CRC before transmit cmdBuffer1
    quEvent1.setQueryCrc({
        Mode: CrcMode.SUM,
        CrcLen:1,
        placeIndex:-2,
        LittleEndian:true,
        crcCheckRange:{
            startIndex:0,
            endIndex:-2
        }
    })
    // when sub-device reply the message , EB start to find the first bytes which should be 0x68
    quEvent1.addAckCheckRule(0,0xa1)
    //the last byte of ackBuffer1 should be 0xa9
    quEvent1.addAckCheckRule(ackBuffer1.length-1,0xa9)
    //EB check the CRC of ackBuffer1
   /*
    quEvent1.setAckCrc({
        Mode: CrcMode.SUM,
        CrcLen:1,
        placeIndex:-2,
        LittleEndian:true,
        crcCheckRange:{
            startIndex:0,
            endIndex:-2
        }
    })
    */
    // build a upEvent1 which will transmit txBuffer by LoRaWAN and the period will be 1 year
    // EB also can make a condition to trigger the transmition when act a convertion
    let upEvent1= new LoraUpEvent("upEvent1", {
        txBuffer:Buffer.from("c1c2c3c4c5c6c7c8c9c0d1d2d3d4d5d6d7d8d9".replaceAll(" ",""),"hex"),
        txPort: 12
    }).setPeriod(86400*365)
    // read 2 bytes value with little-endian int16 format from ackBuffer of quEvent1 and then write to txBuffer with little-endian when quEvent1's ack event happen
    // ONTIME of condition means the message is replied , also the action can be TIMEOUT
    quEvent1.pushEBData(upEvent1.txBuffer.writeInt16LE(
        quEvent1.ackBuffer.readInt16LE(2), 3),{
        condition: ExprCondition.ONTIME
    })
    // a copy action from ackBuffer of quEvent1
    quEvent1.pushEBData(upEvent1.txBuffer.copyFrom(
            {
                bufferOffset: 5,
                byteLength: 4,
                buffer: quEvent1.ackBuffer
            }, 6),{
            condition: ExprCondition.ONTIME,
        }
    )
    //copy bytes from APP ,this byte is battery voltage
    quEvent1.pushEBData(upEvent1.txBuffer.copyFrom(
            {
                bufferOffset: 31,
                byteLength: 1,
                buffer: APP
            }, 10),{
            condition: ExprCondition.ONTIME,
        }
    )
    // a read-write action ,ActionAfertExpr.ALWAYS means that the action will trigger a tranmition by LoRaWAN
    quEvent1.pushEBData(upEvent1.txBuffer.writeUint16LE(
        quEvent1.ackBuffer.readUint16LE(11), 2),{
        condition: ExprCondition.ONTIME,
        ActAfterCvt:ActionAfertExpr.ALWAYS
    })
    // ----------------------------------------------------
    return JSON.stringify(ebModel, null, 2)
}
buildOtaFile(__filename, otaConfig, MODBUS_TT)