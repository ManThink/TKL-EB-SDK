const MT_UpTmplt  = require('./eb-lang-upTmplt');
const MT_Period = require('./eb-lang-period');
const { MT_CrcPara ,MT_CrcFunc}= require('./eb-lang-crcPara');
const Utility = require('./eb-utility');
const JS_ConstString = require('./eb-lang-const');
const JS_CvtRule = require('./eb-pre-cvtRule');
const JS_CopyRule = require("./eb-pre-copyRule");
const MT_BllPara =require('./eb-lang-bllPara')
class JS_UpEvent {
    constructor(data={}) {
        this.name = data.name ?? '';
        this.txBuffer = data.txBuffer ?? '';
        this.confirmduty = data.confirmduty ?? 0;
        this.periodMode =data.periodMode
            ?MT_Period.fromJSON(data.periodMode)
            :new MT_Period();
        this.type =data.type ?? 'normal';
        this.txPort =data.txPort ?? 0;
        this.caculist =data.caculist?.map(cacu=>
            JS_CvtRule.fromJSON(cacu)
        ) || []
        this.copyList =data.copyList?.map(copy=>
            JS_CopyRule.fromJSON(copy)
        ) || [];
        this.crcPara = data.crcPara
            ?MT_CrcPara.fromJSON(data.crcPara)
            :null;
        this.upCond =data.upCond|| 'none';
        this.BllPara = new MT_BllPara();
    }
    static fromJSON(json){
        return new JS_UpEvent(json)
    }

    // 设置 BllPara
    SetBllPara(para) {
        this.BllPara = para;
    }

    // 更新消息
    UpdateMessage(msg) {
        console.log(msg);
    }

    // 获取 UpTmplt
    GetUpTmplt() {
        let confirmduty
        confirmduty=parseInt(this.confirmduty,10)
        const tmplt = new MT_UpTmplt({
            ConfirmDuty:confirmduty,
            Period: this.periodMode,
            Port:this.txPort
        });
        // 转换 txBuffer 为字节数组
        const TxBuf = Utility.StringToArry(this.txBuffer);
        if (TxBuf === null) {
            this.UpdateMessage(`up template should only contains hex data:   #{this.txBuffer}`);
            return -1;
        }
        tmplt.lstUpData=Utility.bufferPush(tmplt.lstUpData,...TxBuf);
        tmplt.TmpltLen = tmplt.lstUpData.length;
        tmplt.Type = JS_ConstString.GetUpTypeIdx(this.type);
        tmplt.UpCond = JS_ConstString.GetUpCondIdx(this.upCond);

        // 处理 caculist
        if (this.caculist && this.caculist.length > 0) {
            for (let i = 0; i < this.caculist.length; i++) {
                this.caculist[i].SetBllPara(this.BllPara);
                const idx = this.caculist[i].GetCvtRule();
                if (idx < 0) {
                    this.UpdateMessage(`wrong format of caculist[${i}]:${cvt.CvtRule}`);
                    return -1;
                }
                tmplt.lstCvtIdx=Utility.bufferPush(tmplt.lstCvtIdx,idx);
            }
        }

        // 处理 CRC 参数
        if (this.crcPara !== null) {
            tmplt.CrcFuncIdx = this.BllPara.InsertCrcFunc(this.crcPara);
            tmplt.CrcLEndian = this.crcPara.LittleEndian;

            if (this.crcPara.PlaceInvert) tmplt.CrcIdx = 0x80 + (this.crcPara.PlaceIdx & 0x7F);
            else tmplt.CrcIdx = this.crcPara.PlaceIdx & 0x7F;

            if (this.crcPara.StartIdx > 31 || this.crcPara.EndIdx > 31) {
                this.UpdateMessage("startIdx and endIdx of crcPara should be less than 32!");
                return -1;
            }

            if (this.crcPara.StartIdx > tmplt.lstUpData.length - 1 ||
                this.crcPara.EndIdx > tmplt.lstUpData.length - 1) {
                this.UpdateMessage(`startIdx ${this.crcPara.StartIdx} or endIdx of crcPara ${this.crcPara.EndIdx} is out of range of up template`);
                return -1;
            }
        } else {
            tmplt.CrcFuncIdx = 0xFF;
        }

        tmplt.CvtNum = tmplt.lstCvtIdx.length;

        // 处理 copyList
        if (this.copyList && this.copyList.length > 0) {
            for (const rule of this.copyList) {
                const CopyRule = rule.GetCopyRule();
                tmplt.lstCopyIdx=Utility.bufferPush(tmplt.lstCopyIdx,this.BllPara.InsertCopyRule(CopyRule));
            }
        }
        tmplt.CopyNum = tmplt.lstCopyIdx.length;

        this.UpdateMessage("build up template success");
        return this.BllPara.InsertUpTmplt(tmplt);
    }
}
/*
let xtest=new JS_UpEvent( JSON.parse(`{
                "name": "MeterData",
                "txBuffer": "82 22 02 000000000000 00000000  0000 0000 0000 0000 0000 0000 00000000 0000 00000000 00000000 00000000 00000000 00",
                "periodMode": {
                    "periodValue": 4000,
                    "unit": "d"
                },
                "txPort": 12,
                "confirmduty": "40",
                "type": "normal",
                "caculist": [
                    {
                        "CvtRule": "app.15.1.uint=temp.80.1.uint,+appsts.3.1.uint,==0,*60,+1"
                    },
                    {
                        "CvtRule": "cond.11.1.uint=app.28.1.uint,<176,*temp.80.1.uint,<<3"
                    },
                    {
                        "CvtRule": "temp.64.1.uint=temp.64.1.uint,*1",
                        "CvtCond": "3",
                        "ActAfterCvt": "rst"
                    }]}`))
let bllPara=new MT_BllPara()
xtest.SetBllPara(bllPara)
xtest.GetUpTmplt()
 */
module.exports = JS_UpEvent;
