import {SetUpCovDataType} from "@EBSDK/EBCompiler/EBModel/interface";
import {QueryEvent} from "@EBSDK/EBCompiler/EBModel/Event/QueryEvent";
import {EBModel} from "@EBSDK/EBCompiler/EBModel/EBModel";
import {ActionAfertExpr, CrcMode, ExprCondition} from "@EBSDK/EBCompiler/EBModel/EBEnum";
import {LoraUpEvent} from "@EBSDK/EBCompiler/EBModel/Event/LoraUpEvent";
import {Buffer} from "buffer";
import {CalcData} from "@EBSDK/EBCompiler/EBModel/EBExpr";
import {isTypedArray} from "node:util/types";
const version="1.02.011"
type TypeVal =
    SetUpCovDataType
    |"BCD"
    |"FloatCDAB"
    |"IntCDAB"
    |"UintCDAB"
    |"HEX"
    |"INVALID"

type TypeProtocol =
    |"DLT64507"
    |"modbus"
    |"modbusBitCov"
    |"CJ188"
    |"any"
class Utils{
    public static readonly INVALID_NUM=-1000000000
    public static readonly INVALID_STR="INVALID"
    public static readonly PERIOD_DEFAULT=900;
    public static readonly PERIOD_DUMB=86400*3650;
    public static readonly PERIOD_TRIGGER="trigger";
    public static readonly PERIOD_MAX =86400*365
    static parseVal(valstr:string):number{
        let val=valstr.toLowerCase();
        if (val.includes("0x")){
            val=val.replaceAll("0x","").replaceAll(" ","");
            let cleanedHex =val.length % 2 === 0 ? val : '0' + val;
            return parseInt(cleanedHex, 16);
        }
        return parseInt(val,10)
    }
    static parseSeconds(time :string){
        let valTime=time.replaceAll(" ","").toLowerCase()
        if (valTime.length==1) {    return parseInt(valTime,10)}
        const valueStr = valTime.slice(0, -1);
        const unit = valTime.slice(-1).toLowerCase();
        let retval=parseInt(valueStr,10)
        switch (unit){
            case "s": return retval;
            case "m": return retval*60;
            case "h": return retval*3600;
            case "d": return retval*86400;
            case "y": return retval*86400*365;
            default:
                return parseInt(valTime,10)
        }
    }
}
interface UserConfQueryItem { //
    name?:string;
    protocol?: TypeProtocol; //
    preamble?:number;
    isLast?: boolean;
    period?: string;
    periodIndex?: number;
    code?: string; // modbus function code, e.g. "0x03" |"03"
    addr?: string; // slave address in hex string "0x123F"|"345"
    cmd?: string; //hex
    ack?: string;
    payIndex?:number;
    ackAddrIndex?:number;
    indexAPP?: number;
    indexCMD?: number;
    copySize?: number;
    listTag?:{
        index:number;
        val:string;
    }[];
    listVal: {
        start: string;
        end: string;
        covAppIndex?: number;
        covType?: TypeVal;
    }[];
}
interface UserConfUPItem {
    name?: string;
    port?: number;
    version?: string;
    dataType: string;
    indexCovStatus?:number;
    indexStatus?:number;
    indexBattery?:number;
    indexAddr?: number;
    addrSize?:number;
    indexApp?: number;
    upPeriod?: string;
    upPeriodIndex?: number;
    quInfo: UserConfQueryItem[];
}
class ConfigPreCopy {
    indexAPP: number;
    indexCMD: number;
    copySize: number;
    static appIndex=150
    constructor(data?: Partial<ConfigPreCopy>) {
        if (data?.indexCMD===undefined ||data?.indexCMD===Utils.INVALID_NUM ||
            data?.copySize===undefined|| data?.copySize===Utils.INVALID_NUM) {
            this.indexAPP =Utils.INVALID_NUM;
            this.indexCMD=Utils.INVALID_NUM;
            this.copySize=Utils.INVALID_NUM;
        }else {
            this.indexCMD = data?.indexCMD ?? Utils.INVALID_NUM;
            this.copySize = data?.copySize ?? Utils.INVALID_NUM;
            if (data.indexAPP===undefined || data.indexAPP===Utils.INVALID_NUM) {
                this.indexAPP = ConfigPreCopy.appIndex;
                ConfigPreCopy.appIndex=this.indexAPP+this.copySize;
            }else {
                this.indexAPP = data?.indexAPP ?? Utils.INVALID_NUM;
            }
        }
    }
    config(event:QueryEvent) {
        if (this.indexAPP===Utils.INVALID_NUM||this.indexCMD===Utils.INVALID_NUM||this.copySize===Utils.INVALID_NUM) {return}
        event.pushEBData(   event.cmdBuffer.copy( EBModel.APP,this.indexAPP,this.copySize,this.indexCMD),
            {condition:ExprCondition.PRE}
        )
    }
}
class ConfigPeriod {
    index: number;
    val: number;
    static periodIndex=70
    constructor(data?: Partial<{index?:number,val?:string}>) {
        if (data?.index!==undefined ) {
            if (data.index===-1) {
                this.index=ConfigPeriod.periodIndex;
                ConfigPeriod.periodIndex = this.index+4
                this.val=Utils.PERIOD_DUMB
                return;
            }
            this.index=data?.index;
            this.val=Utils.PERIOD_DUMB;
            return
        }
        if (data?.val!==undefined ) {
            if (data.val===Utils.PERIOD_TRIGGER) {
                this.val=Utils.PERIOD_DUMB
            }else {
                this.val=Utils.parseSeconds(data.val);
            }
            this.index=Utils.INVALID_NUM;
            return
        }
        this.index=ConfigPeriod.periodIndex;
        ConfigPeriod.periodIndex = this.index+4
        this.val=Utils.PERIOD_DUMB
    }
    config(event:QueryEvent|LoraUpEvent) {
        if (this.index !== Utils.INVALID_NUM){   event.setPeriodFromApp(this.index);
        }else { event.setPeriod(this.val); }
    }
}
class TagItem{
    index:number;
    val:number;
    constructor(data?: Partial<{
        index?:number;
        val?:string;
    }>) {
        this.index = data?.index??Utils.INVALID_NUM;
        if (data?.val===undefined){this.val=0x00
        }else {this.val=Utils.parseVal(data.val)}
    }
    config(event:QueryEvent) {
        if (this.index === Utils.INVALID_NUM){   return}
        event.addAckCheckRule(this.index,this.val)
    }
}
class ValItem {
    start: number;
    end: number;
    ackProcess?:string;
    covAppIndex?: number;
    covType?: TypeVal;
    static covIndex=110
    constructor(data?: Partial<{
        start: string;
        end: string;
        covType?: TypeVal;
        covAppIndex?: number;
    }>) {
        if (data?.start===undefined){ this.start=Utils.INVALID_NUM
        }else { this.start=Utils.parseVal(data.start) }
        if (data?.end===undefined){ this.end=Utils.INVALID_NUM
        }else { this.end=Utils.parseVal(data.end) }
        if (data?.covType===undefined ||data?.covType==="INVALID") {
            this.covAppIndex=Utils.INVALID_NUM;
            this.covType="INVALID";
        }else {
            if (data?.covAppIndex===undefined) {
                this.covAppIndex = ValItem.covIndex
                ValItem.covIndex+=4
            }else {
                this.covAppIndex = data?.covAppIndex
            }
            this.covType = data?.covType
        }
    }
    processAck(quEvent:QueryEvent,upEvent:LoraUpEvent,txIndex:number,indexCovStatus:number){
        if(this.covType==="INVALID" || this.covAppIndex===Utils.INVALID_NUM ){
            quEvent.pushEBData(
                upEvent.txBuffer.copy(quEvent.ackBuffer,this.start,this.end-this.start+1,txIndex),
                {condition:ExprCondition.ONTIME});
        }else if (this.covType==="HEX"){
            let sensorDataBufferOffset =  QueryEvent.ebModel.sensorDataBufferOffset;
            let size=this.end-this.start+1
            quEvent.pushEBData(
                EBModel.SENSOR_DATA.copy(
                    quEvent.ackBuffer,this.start,size,sensorDataBufferOffset
                ),
                {condition: ExprCondition.ONTIME}
            )
            quEvent.pushEBData(
                upEvent.txBuffer.writeUint8(
                    upEvent.txBuffer.readUintBE(txIndex,size).notEqual(EBModel.SENSOR_DATA.readUintBE(sensorDataBufferOffset,size)),
                    indexCovStatus
                ),
                {
                    condition: ExprCondition.ONTIME,
                    ActAfterCvt:ActionAfertExpr.UP_TO_RESULT
                }
            )
            QueryEvent.ebModel.sensorDataBufferOffset += size
            upEvent.pushEBData(upEvent.txBuffer.copy(EBModel.SENSOR_DATA, sensorDataBufferOffset, size, txIndex))
        }else {
            quEvent.setupCov({
                ackBufferIndex: this.start,
                up: {   event: upEvent, txBufferIndex: txIndex},
                binaryDataType: this.covType as SetUpCovDataType,
                appBufferCovThresholdIndex: this.covAppIndex,
                txCovResultIndex: indexCovStatus
            })
        }
        return {
            txIndex:txIndex+this.end-this.start+1,
            txLength:this.end-this.start+1,
        }
    }
}
class EventConfig {
    name: string;
    port: number;
    version: number;
    dataType: number;
    addrSize:number;
    indexCovStatus:number;
    indexStatus:number;
    indexBattery:number;
    indexAddr: number;
    indexApp: number;
    upPeriod: ConfigPeriod;
    static eventIndex=0
    static quIndex=0
    static dataType=0x31
    constructor(data?: Partial<UserConfUPItem>) {
        this.name = data?.name?? ("event_"+(EventConfig.eventIndex++).toString());
        this.port = data?.port?? 22;
        if (data?.version===undefined) {    this.version = 0x83
        }else { this.version=Utils.parseVal(data.version);    }
        if (data?.dataType===undefined) { this.dataType=EventConfig.dataType++
        }else { this.dataType=Utils.parseVal(data.dataType); }
        this.indexCovStatus = data?.indexCovStatus?? 2;
        this.indexStatus = data?.indexStatus ?? 3;
        this.indexBattery = data?.indexBattery ?? 4;
        this.indexAddr = data?.indexAddr ?? 5;
        this.addrSize=data?.addrSize ?? 1;
        this.indexApp = this.indexAddr+this.addrSize
        this.upPeriod=new ConfigPeriod({index:data?.upPeriodIndex,val:data?.upPeriod })
    }
}
class QuFrameInfo{
    start:number=0;
    end:number=0;
    group:number=0;
    constructor() {
        this.start=0;
        this.end=0;
        this.group=0;
    }
    getInfo(list:{ start: string; end: string; covAppIndex?: number; covType?: TypeVal; }[]) {
        let listVal:ValItem[]=[]
        list.forEach(item=>{
            let valItem=new ValItem(item)
            listVal.push(valItem)
        })
        this.group=0
        if (listVal.length===0) {return }
        this.start = listVal[0].start;
        this.end = listVal[0].end;
        listVal.forEach(data => {
            if (data.start < this.start) this.start = data.start;
            if (data.end > this.end) this.end = data.end;
            this.group++
        });
    }
}
abstract class QuItemBase {
    name:string;  // name query event
    protocol:TypeProtocol;
    isLast: boolean;
    period: ConfigPeriod;
    preCopy: ConfigPreCopy;
    cmd:Buffer;
    ack:Buffer;
    addr:Buffer;
    code:Buffer;
    payIndex:number;
    ackAddrIndex:number;
    txDataLen:number=0;
    preamble:number=5;
    listVal: ValItem[];
    listTag: TagItem[];
    quEvent: QueryEvent;
    _userConfQueryItem:Partial<UserConfQueryItem>;
    _inited=false
    _setuped =false
    static quIndex:number=0;
    constructor(data?: Partial<UserConfQueryItem>) {
        this.isLast = data?.isLast??false;
        this.protocol=data?.protocol??"modbus";
        this.preamble=data?.preamble??5;
        this.name = data?.name??"default";
        this.payIndex=data?.payIndex??0;
        this.ackAddrIndex=data?.ackAddrIndex??0;
        this.listTag=[]
        this.listVal=[]
        this._userConfQueryItem=data
        this._inited=false
        this._setuped=false
    }
    static parseToBuffer(inputStr: string | undefined,erroMessage:string):Buffer{
        if (inputStr==undefined){
            return Buffer.alloc(0)
        }
        let xstr=inputStr.replaceAll("0x","").replaceAll("0X","").replaceAll(" ","")
        return Buffer.from(xstr.length%2===0?xstr:('0'+xstr),"hex")
    }
    protected getProtocol():TypeProtocol{   return "any"}
    protected getPayIndex(): number { return 0}
    protected getAckAddrIndex(): number { return 0}
    protected parseCmd(inputStr: string | undefined): Buffer{ return QuItemAny.parseToBuffer(inputStr,"no cmd") }
    protected parseAck(inputStr: string | undefined): Buffer{ return QuItemAny.parseToBuffer(inputStr,"no ack")}
    protected parseAddr(inputStr: string | undefined): Buffer {return  Buffer.alloc(0) }
    protected parseCode(inputStr:string | undefined): Buffer {return    Buffer.alloc(0) }
    protected parsePeriod(data?: Partial<UserConfQueryItem>){
        this.period=new ConfigPeriod({index:data?.periodIndex,val:data?.period})
    }
    protected parsePreCopy(data?: Partial<UserConfQueryItem>){
        if (data?.indexAPP===undefined || data?.indexCMD===undefined||data?.copySize===undefined) {
            this.preCopy = new ConfigPreCopy({  indexAPP:Utils.INVALID_NUM, indexCMD:Utils.INVALID_NUM, copySize:Utils.INVALID_NUM});
            return
        }
        this.preCopy=new ConfigPreCopy({indexAPP:data.indexAPP, indexCMD:data.indexCMD, copySize:data.copySize})
    }
    protected parseTagList(dataListTag: {index:number,val:string}[]) {
        if (dataListTag !== undefined) {
            dataListTag.forEach(item=>{
                let tag=new TagItem(item)
                this.listTag.push(tag)
            })
        }
    }
    protected parseListVal(dataListVal: {
        start: string
        end: string
        ackProcess?: string
        covAppIndex?: number
        covType?: TypeVal
    }[]){
        dataListVal.forEach(item=>{
            let valItem=new ValItem(item)
            valItem.start=this.payIndex+valItem.start
            valItem.end=this.payIndex+valItem.end
            this.txDataLen+=valItem.end-valItem.start+1
            if (valItem.covAppIndex!==Utils.INVALID_NUM) {
                console.log("[cov index ]"+this.name+" : "+valItem.covAppIndex.toString())
            }
            this.listVal.push(valItem)
        })
    }
    protected _init():void{
        if (this._inited) { return }
        this._inited=true
        if (this._userConfQueryItem?.protocol==undefined) {this.protocol=this.getProtocol()}
        if (this._userConfQueryItem?.name==undefined){ this.name=this.protocol+"_"+(EventConfig.quIndex++).toString(); }
        if (this._userConfQueryItem?.payIndex==undefined) { this.payIndex=this.getPayIndex(); }
        if (this._userConfQueryItem?.ackAddrIndex==undefined) {this.ackAddrIndex=this.getAckAddrIndex();}
        this.cmd =  this.parseCmd(this._userConfQueryItem?.cmd);
        this.ack =  this.parseAck(this._userConfQueryItem?.ack);
        this.addr = this.parseAddr(this._userConfQueryItem?.addr);
        this.code = this.parseCode(this._userConfQueryItem?.code);
        this.parsePeriod(this._userConfQueryItem)
        this.parsePreCopy(this._userConfQueryItem)
        this.parseTagList(this._userConfQueryItem?.listTag)
        if (this._userConfQueryItem?.listVal===undefined) {    throw  new Error("no listVal")
        }else{
            this.parseListVal(this._userConfQueryItem?.listVal)
        }
    }
    init(){ this._init()}
    protected buildCommand(eventPara:EventConfig,upEvent:LoraUpEvent,txIndex:number):void{
        return
    }
    protected  setDefaultTags(): void{
        return
    }
    protected setCrcRules(quEvent: QueryEvent) {
        this.quEvent.setQueryCrc({
            Mode: CrcMode.CRC16, placeIndex: -2, LittleEndian: true,
            crcCheckRange: {startIndex: 0, endIndex: -2}
        });
        this.quEvent.setAckCrc({
            Mode: CrcMode.CRC16, placeIndex: -2, LittleEndian: true,
            crcCheckRange: {startIndex: 0, endIndex: -2}
        });
    }
    protected processStart(
        data:{
            eventPara?:EventConfig,
            upEvent?:LoraUpEvent,
            quEvent?:QueryEvent,
            txIndex:number}) {
        return data.txIndex;
    }
    protected processAckBuffer(data:{
        eventPara:EventConfig,
        upEvent:LoraUpEvent,
        quEvent:QueryEvent,
        txIndex:number}) {
        let txIndex:number=data.txIndex;
        let  txDataLen=0
        this.listVal.forEach(val=>{
            let txInfo:{txIndex:number,txLength:number}
            txInfo = val.processAck(
                this.quEvent, data.upEvent, txIndex, data.eventPara.indexCovStatus
            )
            txIndex=txInfo.txIndex;
            txDataLen+=txInfo.txLength
        })
        return txIndex
    }
    protected processEnd(data:{
        eventPara?:EventConfig,
        upEvent?:LoraUpEvent,
        quEvent?:QueryEvent,
        txIndex:number}) {
        return data.txIndex;
    }
    protected _setupQuEvent(eventPara:EventConfig,upEvent:LoraUpEvent,txIndex:number) {
        if(this._setuped) { return this.txDataLen}
        this._setuped=true
        this.buildCommand(eventPara,upEvent,txIndex)
        this.quEvent = new QueryEvent("qu_"+this.name, {cmdBuffer: this.cmd, ackBuffer: this.ack,})
        this.listTag.forEach(item=>{    item.config(this.quEvent)   })
        this.setDefaultTags()
        this.setCrcRules(this.quEvent)
        this.preCopy.config(this.quEvent)
        if (this.preCopy.indexAPP!==Utils.INVALID_NUM) {
            console.log("[pre copy  index]" + this.name +":"
                + this.preCopy.indexAPP.toString()+" To "
                + this.preCopy.indexCMD.toString()+" size "
                + this.preCopy.copySize.toString())
        }
        this.period.config(this.quEvent)
        if (this.period.index!==Utils.INVALID_NUM){
            console.log("[qu period index]" + this.name +":"+ this.period.index.toString())
        } else {
            console.log("[qu period]" + this.name +":"+ this.period.val.toString())
        }
        txIndex=this.processStart({
            eventPara:eventPara,
            upEvent:upEvent,
            quEvent:this.quEvent,
            txIndex:txIndex
        });
        txIndex=this.processAckBuffer({
            eventPara:eventPara,
            upEvent:upEvent,
            quEvent:this.quEvent,
            txIndex:txIndex
        })
        txIndex=this.processEnd({
            eventPara:eventPara,
            upEvent:upEvent,
            quEvent:this.quEvent,
            txIndex:txIndex
        })
        this.quEvent.pushEBData(upEvent.txBuffer.copy(this.quEvent.ackBuffer,this.ackAddrIndex,eventPara.addrSize,eventPara.indexAddr),{condition:ExprCondition.ONTIME})
        let act=ActionAfertExpr.NONE
        if (this.isLast) { act=ActionAfertExpr.ALWAYS }
        this.quEvent.pushEBData(upEvent.txBuffer.writeUint8(EBModel.DEVICE_STATUS.readUint8(3),eventPara.indexBattery),{ActAfterCvt:act})
        this.quEvent.pushEBData(upEvent.txBuffer.writeUint8(EBModel.APP_STATUS.readUint8(2),eventPara.indexStatus),{ActAfterCvt:act})
        return txIndex
    }
    setupQuEvent(eventPara:EventConfig,upEvent:LoraUpEvent,txIndex:number) {
        return this._setupQuEvent(eventPara,upEvent,txIndex)
    }
}
class QuItemAny extends QuItemBase {
    constructor(data?: Partial<UserConfQueryItem>) {    super(data);    }
}
class QuItemModBus extends QuItemBase {
    freeValue:boolean;
    modBusFrameInfo :QuFrameInfo=new QuFrameInfo();
    constructor(data?: Partial<UserConfQueryItem>) {
        super(data);
        this.freeValue=false
    }
    protected getPayIndex(): number { return 3}
    protected getAckAddrIndex(): number { return 0}
    protected parseCmd(inputStr: string | undefined): Buffer{
        if (inputStr===undefined) { return Buffer.from([0x01, 0x03, 0x01, 0x00, 0x00, 0x39, 0x00, 0x00]);   }
        return QuItemAny.parseToBuffer(inputStr,"no cmd")
    }
    protected parseAck(inputStr: string | undefined): Buffer{
        if (inputStr===undefined) { return Buffer.alloc(0);   }
        this.freeValue=true
        return QuItemAny.parseToBuffer(inputStr,"no ack")
    }
    protected parseAddr(inputStr: string | undefined): Buffer {
        if (inputStr===undefined) { return Buffer.alloc(0); }
        let retval=Buffer.alloc(1)
        retval[0]=Utils.parseVal(inputStr);
        return retval
    }
    protected parseCode(inputStr:string | undefined): Buffer {
        let retval=Buffer.alloc(1)
        if (inputStr===undefined) { return Buffer.alloc(0); }
        retval[0]=Utils.parseVal(inputStr);
        return retval
    }
    protected parseListVal(dataListVal: {
        start: string
        end: string
        ackProcess?: string
        covAppIndex?: number
        covType?: TypeVal
    }[]){
        if (this.freeValue){
            super.parseListVal(dataListVal)
            return
        }
        let listVal=[]
        this.modBusFrameInfo.getInfo(dataListVal)
        dataListVal.forEach(item=>{
            let valItem=new ValItem(item)
            listVal.push(valItem)
        })
        let code=0x03
        if (this.code.length>0) { code=this.code[0]
        }else { code=this.cmd[1] }
        if (code==0x01 ||code==0x02 ) { // bits type
            const bitCount = this.modBusFrameInfo.end - this.modBusFrameInfo.start + 1
            let byteCount = Math.ceil(bitCount / 8)
            let val=new ValItem({
                start: (this.payIndex).toString(),
                end:(this.payIndex+byteCount-1).toString(),
                covAppIndex:listVal[0]?.covAppIndex,
                covType:listVal[0]?.covType??"INVALID"
            })
            this.txDataLen+=byteCount
            this.listVal.push(val)
        }else {
        listVal.forEach(item=>{
            let val=new ValItem({
                start: (this.payIndex+(item.start-this.modBusFrameInfo.start)*2).toString(),
                end:(this.payIndex+(item.end-this.modBusFrameInfo.start)*2+1).toString(),
                covAppIndex:item?.covAppIndex,
                covType:item?.covType
            })
            if (val.covType!=="INVALID") {
                console.log("[cov index ]"+this.name+" : "+val.covAppIndex.toString())
            }
            this.txDataLen+=(item.end-item.start+1)*2
            this.listVal.push(val)
        })
        }
    }
    protected buildCommand(eventPara:EventConfig,upEvent:LoraUpEvent,txIndex:number):void{
        if (this.addr.length>0) { this.addr.copy(this.cmd,0) }
        if (this.code.length>0) { this.code.copy(this.cmd,1) }
        if (this.freeValue){
            super.buildCommand(eventPara,upEvent,txIndex); return
        }
        this.cmd.writeUInt16BE(this.modBusFrameInfo.start,2)
        this.cmd.writeUInt16BE(this.modBusFrameInfo.end-this.modBusFrameInfo.start+1,4)
        if (this.cmd[1]==0x01 ||this.cmd[1]==0x02 ){
            const bitCount = this.modBusFrameInfo.end - this.modBusFrameInfo.start + 1
            let byteCount = Math.ceil(bitCount / 8)
            this.ack=Buffer.alloc(5+byteCount);
        }else{
            this.ack=Buffer.alloc(5+(this.modBusFrameInfo.end-this.modBusFrameInfo.start+1)*2);
        }
    }
    protected setDefaultTags(){
        if (this.listTag.length!==0) { return; }
        if(this.preCopy.indexCMD===Utils.INVALID_NUM) {
            this.quEvent.addAckCheckRule(0, this.cmd[0]);
            this.quEvent.addAckCheckRule(1, this.cmd[1]);
        }else {
            if (this.preCopy.indexCMD!==0 ) { this.quEvent.addAckCheckRule(0, this.cmd[0]);}
            if(this.preCopy.indexCMD>1 ) {this.quEvent.addAckCheckRule(1, this.cmd[1]);}
        }
        if (this.cmd[1]==0x01 ||this.cmd[1]==0x02 ) {
            const bitCount = this.modBusFrameInfo.end - this.modBusFrameInfo.start + 1
            let byteCount = Math.ceil(bitCount / 8)
            this.quEvent.addAckCheckRule(2,byteCount)
        }else {
            this.quEvent.addAckCheckRule(2,(this.modBusFrameInfo.end-this.modBusFrameInfo.start+1)*2)
        }
    }
    protected setCrcRules(quEvent: QueryEvent) {
        this.quEvent.setQueryCrc({
            Mode: CrcMode.CRC16, placeIndex: -2, LittleEndian: true,
            crcCheckRange: {startIndex: 0, endIndex: -2}
        });
        this.quEvent.setAckCrc({
            Mode: CrcMode.CRC16, placeIndex: -2, LittleEndian: true,
            crcCheckRange: {startIndex: 0, endIndex: -2}
        });
    }
}
class QuItemCJ188 extends QuItemBase {
    constructor(data?: Partial<UserConfQueryItem>) {
        super(data);
    }
    protected getPayIndex(): number { return 0}
    protected getAckAddrIndex(): number { return 2}
    protected parseCmd(inputStr: string | undefined): Buffer{
        let preamblestr=Array(this.preamble).fill("FE").join("")
        if (inputStr==undefined) {
            inputStr=preamblestr+"68aa aaaaaaaaaaaaaa 03 03 810a 00 49 16"
        }else {
            inputStr=preamblestr+inputStr
        }
        return QuItemAny.parseToBuffer(inputStr,"no cmd")
    }
    protected parseAck(inputStr: string | undefined): Buffer{
        if (inputStr===undefined) { return Buffer.alloc(0);   }
        inputStr=inputStr.replaceAll("0x","").replaceAll("0X","").replace(/^(FE)+/, "");
        return QuItemAny.parseToBuffer(inputStr,"no ack")
    }
    protected parseAddr(inputStr: string | undefined): Buffer {
        if (inputStr===undefined) { return Buffer.alloc(0); }
        inputStr=inputStr.padStart(14,"0")
        return QuItemAny.parseToBuffer(inputStr,"no cmd")
    }
    protected parseCode(inputStr:string | undefined): Buffer {
        if (inputStr===undefined) { return Buffer.alloc(0); }
        return QuItemAny.parseToBuffer(inputStr,"no cmd")
    }
    protected parsePreCopy(data?: Partial<UserConfQueryItem>){
        if (data?.indexAPP===undefined || data?.indexCMD===undefined||data?.copySize===undefined) {
            return super.parsePreCopy(data)
        }
        data.indexCMD=data.indexCMD+this.preamble
        this.preCopy=new ConfigPreCopy({indexAPP:data.indexAPP, indexCMD:data.indexCMD, copySize:data.copySize})
    }
    protected buildCommand(eventPara:EventConfig,upEvent:LoraUpEvent,txIndex:number):void{
        if (this.addr.length>0) { this.addr.copy(this.cmd,this.preamble+2) }
        if (this.code.length>0) { this.code.copy(this.cmd,this.preamble+9) }
        super.buildCommand(eventPara,upEvent,txIndex); return
    }
    protected setDefaultTags(){
        this.quEvent.addAckCheckRule(0,0x68)
        this.quEvent.addAckCheckRule(-1,0x16)
    }
    protected setCrcRules(quEvent: QueryEvent) {
        this.quEvent.setQueryCrc({
            Mode: CrcMode.SUM, CrcLen:1, placeIndex:-2, LittleEndian:true,
            crcCheckRange:{startIndex:this.preamble, endIndex:-2}
        })
        this.quEvent.setAckCrc({
            Mode: CrcMode.SUM, CrcLen:1, placeIndex:-2, LittleEndian:true,
            crcCheckRange:{startIndex:0, endIndex:-2}
        })
    }
}
class QuItemDLT64507 extends QuItemBase {
    constructor(data?: Partial<UserConfQueryItem>) {
        super(data);
    }
    protected getPayIndex(): number { return 0 }
    protected getAckAddrIndex(): number { return 1 }
    protected getProtocol(): TypeProtocol { return "DLT64507" }
    protected parseCmd(inputStr: string | undefined): Buffer {
        const preamblestr = Array(this.preamble).fill("FE").join("");
        // 默认报文：
        // FE FE FE FE 68 AA AA AA AA AA AA 68 11 04 33 33 34 33 CS 16
        // 其中 11 = 读数据
        // 04 = 数据标识长度
        // 33333433 对应 DI 经过 +0x33 处理后的默认值示例
        if (inputStr === undefined) {
            inputStr = preamblestr + "68aaaaaaaaaaaa68 11 04 33 33 34 33 00 16";
        } else {
            inputStr = preamblestr + inputStr;
        }
        return QuItemAny.parseToBuffer(inputStr, "no cmd");
    }
    protected parseAck(inputStr: string | undefined): Buffer {
        if (inputStr === undefined) return Buffer.alloc(0);
        inputStr = inputStr
            .replaceAll("0x", "")
            .replaceAll("0X", "")
            .replace(/^(FE)+/i, "");

        return QuItemAny.parseToBuffer(inputStr, "no ack");
    }

    protected parseAddr(inputStr: string | undefined): Buffer {
        if (inputStr === undefined) return Buffer.alloc(0);
        // DLT645 地址为 6 字节，通常低位在前
        const clean = inputStr.replaceAll("0x", "").replaceAll("0X", "").replaceAll(" ", "");
        const hex = clean.padStart(12, "0");
        return Buffer.from(hex, "hex");
    }
    protected parseCode(inputStr: string | undefined): Buffer {
        if (inputStr === undefined) return Buffer.alloc(0);
        return  QuItemAny.parseToBuffer(inputStr, "no ack");
    }
    protected parsePreCopy(data?: Partial<UserConfQueryItem>){
        if (data?.indexAPP===undefined || data?.indexCMD===undefined||data?.copySize===undefined) {
            return super.parsePreCopy(data)
        }
        data.indexCMD=data.indexCMD+this.preamble
        this.preCopy=new ConfigPreCopy({indexAPP:data.indexAPP, indexCMD:data.indexCMD, copySize:data.copySize})
    }
    protected buildCommand(eventPara: EventConfig, upEvent: LoraUpEvent, txIndex: number): void {
        // DLT645-2007:
        // FE...FE 68 A0 A1 A2 A3 A4 A5 68 C L DATA CS 16
        // 前导 FE 数量 = this.preamble
        // 地址起始位置 = preamble + 1
        // 第二个 68 后一字节为控制码，位置 = preamble + 8
        if (this.addr.length > 0) {
            this.addr.copy(this.cmd, this.preamble + 1);
        }
        if (this.code.length > 0) {
            this.code.copy(this.cmd, this.preamble + 8);
        }
        super.buildCommand(eventPara, upEvent, txIndex);
    }
    protected setDefaultTags() {
        // 去掉 FE 后，响应帧一般是：
        // 68 A0 A1 A2 A3 A4 A5 68 91 ...
        this.quEvent.addAckCheckRule(0, 0x68);
        this.quEvent.addAckCheckRule(7, 0x68);
        // 若未指定控制码，默认检查 0x91（读数据正常应答）
     //   if (this.code.length > 0) {
     //       this.quEvent.addAckCheckRule(8, this.code[0] | 0x80);
     //   } else {
     //       this.quEvent.addAckCheckRule(8, 0x91);
     //   }
        this.quEvent.addAckCheckRule(-1, 0x16);
    }

    protected setCrcRules(quEvent: QueryEvent) {
        this.quEvent.setQueryCrc({
            Mode: CrcMode.SUM,
            CrcLen: 1,
            placeIndex: -2,
            LittleEndian: true,
            crcCheckRange: {
                startIndex: this.preamble,
                endIndex: -2
            }
        });

        this.quEvent.setAckCrc({
            Mode: CrcMode.SUM,
            CrcLen: 1,
            placeIndex: -2,
            LittleEndian: true,
            crcCheckRange: {
                startIndex: 0,
                endIndex: -2
            }
        });
    }
}
class QuItemModBusBitCov extends QuItemModBus {
    protected parseListVal(dataListVal: {
        start: string
        end: string
        ackProcess?: string
        covAppIndex?: number
        covType?: TypeVal
    }[]){
        let listVal=[]
        this.modBusFrameInfo.getInfo(dataListVal)
        dataListVal.forEach(item=>{
            let valItem=new ValItem(item)
            listVal.push(valItem)
        })
        listVal.forEach(item=>{
            let val=new ValItem({
                start: (this.payIndex+(item.start-this.modBusFrameInfo.start)*2).toString(),
                end:(this.payIndex+(item.end-this.modBusFrameInfo.start)*2+1).toString(),
                covAppIndex:item?.covAppIndex,
                covType:item?.covType
            })
            if (val.covType!=="INVALID") {
                console.log("[cov index ]"+this.name+" : "+val.covAppIndex.toString())
            }
            this.listVal.push(val)
        })
        this.txDataLen+=this.modBusFrameInfo.group
    }
    protected processAckBuffer(data:{
        eventPara:EventConfig,
        upEvent:LoraUpEvent,
        quEvent:QueryEvent,
        txIndex:number}) {
        data.quEvent.pushEBData(
            EBModel.SENSOR_DATA.writeUint8(new CalcData(0), 0),
            {
                condition: ExprCondition.ONTIME,
                Repeat: this.modBusFrameInfo.group
            }
        );
        let bitIndex=0;
        this.listVal.forEach(item=>{
            data.quEvent.pushEBData(
                EBModel.SENSOR_DATA.writeUint8(
                    data.quEvent.ackBuffer.readUint16BE(item.start).
                    notEqual(0).leftShift(bitIndex).bitwiseOr(EBModel.SENSOR_DATA.readUint8(0)),data.txIndex
                ),
                {
                    condition: ExprCondition.ONTIME,
                    Repeat: (item.end-item.start+1)/2,
                }
            )
            bitIndex++
        })
        data.quEvent.pushEBData(
            data.upEvent.txBuffer.writeUint8(
                EBModel.SENSOR_DATA.readUintBE(0,this.modBusFrameInfo.group).notEqual(
                    data.upEvent.txBuffer.readUintBE(data.txIndex,this.modBusFrameInfo.group)
                )
                ,data.eventPara.indexCovStatus),
            {
                condition: ExprCondition.ONTIME,
                ActAfterCvt:ActionAfertExpr.UP_TO_RESULT
            }
        )
        data.upEvent.pushEBData(data.upEvent.txBuffer.copy(EBModel.SENSOR_DATA,0,this.modBusFrameInfo.group,data.txIndex))
        return data.txIndex+this.modBusFrameInfo.group
    }
}
/////////////////////////////////////////////////////////////////////////////
type TypeQuItem=QuItemModBus|QuItemDLT64507|QuItemAny|QuItemCJ188
const QuItemMap = {
    modbus: QuItemModBus,
    DLT64507: QuItemDLT64507,
    modbusBitCov: QuItemModBusBitCov,
    CJ188:QuItemCJ188,
    any: QuItemAny
};
const DEFAULT_QuItem = QuItemAny;
//////////////////////////////////////////////////////////////////////
class EventInfoItem {
    eventPara: EventConfig;
    quInfo: Array<QuItemBase>;
    upEvent:LoraUpEvent;
    txLength:number;
    constructor(data?: Partial<UserConfUPItem>,option?:{quItemClass?:new () => QuItemBase}) {
        this.eventPara=new EventConfig(data);
        this.txLength=0
        this.quInfo=[]
        let qcounts=data?.quInfo?.length
        for (let i=0;i<qcounts;i++) {
            let item=data?.quInfo[i]
            const ItemClass = option?.quItemClass??(QuItemMap[item.protocol] || DEFAULT_QuItem);
            const quInstance = new ItemClass(item);
            quInstance.init()
            this.txLength += quInstance.txDataLen;
            if(quInstance.isLast==undefined) {
                if ((this.eventPara.upPeriod.val >= Utils.PERIOD_MAX)&&(this.eventPara.upPeriod.index!==Utils.INVALID_NUM) && i === qcounts - 1) {
                    quInstance.isLast = true;
                }else {
                    quInstance.isLast = false;
                }
            }
            this.protocolBuild(quInstance.protocol)
            this.quInfo.push(quInstance);
        }
    }
    protected protocolBuild( protocol:string) {
        if(protocol==="DLT64507" ) {
            if (this.eventPara.addrSize<6) this.eventPara.addrSize=6
        }else if (protocol==="CJ188") {
            this.eventPara.addrSize=7;
        }
        return
    }
    upEventSetup() {
        let txBuffer = Buffer.alloc(5+this.eventPara.addrSize+this.txLength);
        txBuffer[0]=this.eventPara.version
        txBuffer[1] = this.eventPara.dataType; // 设备类型
        txBuffer[this.eventPara.indexStatus]=0x02;
        this.upEvent = new LoraUpEvent("up_"+this.eventPara.name, {
            txBuffer: txBuffer,
            txPort: this.eventPara.port
        })
        this.eventPara.upPeriod.config(this.upEvent);
        if (this.eventPara.upPeriod.index!==Utils.INVALID_NUM){
            console.log("[up period index ] "+this.eventPara.name+":"+this.eventPara.upPeriod.index.toString(10))
        }else {
            console.log("[up period ] "+this.eventPara.name+":"+this.eventPara.upPeriod.val.toString(10))
        }
    }
    eventInstall(){
        let txIndex=this.eventPara.indexApp
        this.quInfo.forEach((item:any)=>{
            item.init()
            txIndex=item.setupQuEvent(this.eventPara,this.upEvent,txIndex);
        })
    }
}
export {version,Utils,UserConfQueryItem,UserConfUPItem,TypeVal,TypeProtocol,TypeQuItem,QuItemMap,
    ConfigPreCopy,ConfigPeriod,TagItem,ValItem,EventConfig,
    QuFrameInfo,QuItemBase,QuItemModBus,QuItemModBusBitCov,QuItemDLT64507,QuItemCJ188,EventInfoItem}