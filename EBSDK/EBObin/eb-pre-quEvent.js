const MT_Period  = require('./eb-lang-period');
const MT_QueryPara  = require('./eb-lang-queryPara');
const { MT_CrcPara,MT_CrcFunc} = require('./eb-lang-crcPara');
const MT_Tag = require('./eb-lang-tag');
const JS_CvtRule = require('./eb-pre-cvtRule');
const JS_CopyRule = require('./eb-pre-copyRule');
const MT_CopyRule =require('./eb-lang-copyRule')
const MT_CvtRule = require('./eb-lang-cvtRule');
const MT_QueryTmplt  = require('./eb-lang-queryTmplt');
const Utility =require('./eb-utility')
const MT_BllPara =require('./eb-lang-bllPara')
const JS_ConstString =require('./eb-lang-const')
class MT_quEvent  {
    // 必填项
    // "cmdBuffer"
    // "ackBuffer"
    // "queryPeriod": {
    //     "periodValue": number,
    //     "unit": "s" | "m" | "h" | "d"
    // },
    constructor(data={}) {
        this.name = data.name ?? '';
        this.cmdBuffer = data.cmdBuffer ?? '';
        // none: 任何条件都执行  1: ontime 上一次查询成功后执行  2： timeout 上次查询超时后继续执行
        // 目前  1 2 未使用过
        this.queryCond = data.queryCond ?? 'none'; 
        this.ackBuffer = data.ackBuffer ?? '';
        // fixedAcq 决定是否启用fixedMoment， fixedMoment单位为second
        this.fixedAcq = data.fixedAcq ?? false;
        this.fixedMoment = data.fixedMoment ?? 0;
        this.CheckLen = data.CheckLen ?? true;
        this.ifSelect = data.ifSelect ?? 'uart2'; // interface for sending the query cmd
        if (!data.queryPeriod ) {
            throw new Error('queryPeriod is required');
        }
        this.queryPeriod =  MT_Period.fromJSON(data.queryPeriod);

        this.MulDev_NewGrpStart = data.MulDev_NewGrpStart|| false;

        this.UpAfterQuery = data.UpAfterQuery || false; 
        this.UpAfterQueryEventIdx = data.UpAfterQueryEventIdx || 0;

        // 初始化为 null 或空数组
        this.queryCrcPara = data.queryCrcPara ? MT_CrcPara.fromJSON(data.queryCrcPara) : null;

        // 判断抄表对象ack是否为有效回复
        this.tagChecklist = data.tagChecklist?.map(tag=>
            MT_Tag.fromJSON(tag)
        ) || []
        this.ackCrcPara = data.ackCrcPara ? MT_CrcPara.fromJSON(data.ackCrcPara) : null;
        this.caculist=data.caculist?.map(cacu=>
            JS_CvtRule.fromJSON(cacu)
        ) || []
        this.copyList = data.copyList?.map(copy=>
            JS_CopyRule.fromJSON(copy)
        ) || []

        // BllPara 私有属性
        this._BllPara = new MT_BllPara();
    }
    static fromJSON(json){
        return new MT_quEvent(json)
    }
    /**
     * 设置 BllPara
     * @param {MT_BllPara} para BllPara 对象
     */
    SetBllPara(para) {
        this._BllPara = para;
    }
    /**
     * 更新消息
     * @param {string} msg 消息内容
     */
    UpdateMessage(msg) {
        console.log(msg)
    }
    /**
     * 获取查询参数
     * @returns {number} 查询参数索引
     */
    GetQuPara() {
        try {
            // 获取查询模板索引
            const QueryTmpltIdx = this.GetQuTmplt();

            if (QueryTmpltIdx < 0) {
                this.UpdateMessage('Build query event failed');
                return -1;
            }
            // 创建查询参数对象
            const QuPara = new MT_QueryPara(
                {
                    QueryPeriod:this.queryPeriod,
                    QueryTmpltIdx:QueryTmpltIdx,
                    MulDev_GroupOver:this.MulDev_NewGrpStart,
                    UpAfterQuery: this.UpAfterQuery,
                    UpAfterQueryEventIdx: this.UpAfterQueryEventIdx
                }
            );

            this.UpdateMessage('Build query event success');

            // 插入查询参数并返回索引
            return this._BllPara.InsertQueryPara(QuPara);
        } catch (error) {
            this.UpdateMessage(`Error in GetQuPara: ${error.message}`);
            return -1;
        }
    }
    GetQuTmplt() {
        try {
            let Tmplt = new MT_QueryTmplt();

            // 转换查询命令
            let QueryCmd=Utility.StringToArry(this.cmdBuffer)
            if (!QueryCmd) {
                this.UpdateMessage(`Query cmd can only contains hex data: ${this.cmdBuffer}`);
                return -1;
            }

            // 设置长度检查
            Tmplt.CheckLen = this.CheckLen ? 1 : 0;

            // 添加查询命令
            Tmplt.lstQueryCmd = QueryCmd;
            Tmplt.QueryCmdLen = QueryCmd.length;

            // 转换应答数据
            let AckData = Utility.StringToArry(this.ackBuffer);
            if ((this.ifSelect === 'uart1' || this.ifSelect === 'uart2') && !AckData) {
                this.UpdateMessage(`Ack data can only contains hex data: ${this.ackBuffer}`);
                return -1;
            }

            if (AckData) {
                Tmplt.AckLen = AckData?.length ?? 0;
            }

            // 设置其他基本属性
            Tmplt.FixedAcq = this.fixedAcq;
            Tmplt.FixedMoment = this.fixedMoment;
            Tmplt.IFSelect = JS_ConstString.GetIFIdx(this.ifSelect);

            // 处理应答 CRC
            if (this.ackCrcPara) {
                Tmplt.AckCrc_CalcIdx=this._BllPara.InsertCrcFunc(this.ackCrcPara)
                Tmplt.AckCrc_LEndian = this.ackCrcPara.LittleEndian;
                if (this.ackCrcPara.PlaceInvert) {
                    Tmplt.AckCrc_DesIdx = (0x80 + (this.ackCrcPara.PlaceIdx & 0x7F))&0xFF;
                } else {
                    Tmplt.AckCrc_DesIdx = this.ackCrcPara.PlaceIdx & 0x7F;
                }
                if (this.ackCrcPara.StartIdx > 31 || this.ackCrcPara.EndIdx > 31) {
                    this.UpdateMessage("startIdx and endIdx of ackCrcPara should be less than 32!");
                    return -1;
                }
                if (this.ackCrcPara.StartIdx > Tmplt.AckLen - 1 || this.ackCrcPara.EndIdx > Tmplt.AckLen - 1) {
                    this.UpdateMessage(`"startIdx " + ${this.ackCrcPara.StartIdx} + "or endIdx of ackCrcPara" + ${this.ackCrcPara.EndIdx}+ "is out of range of ack data!"`);
                    return -1;
                }
            } else {
                Tmplt.AckCrc_CalcIdx = 0xFF;
            }
            // 处理查询 CRC
            if (this.queryCrcPara) {
                Tmplt.QueryCrc_CalcIdx = this._BllPara.InsertCrcFunc(this.queryCrcPara);
                Tmplt.QueryCrc_LEndian = this.queryCrcPara.LittleEndian;
                if (this.queryCrcPara.PlaceInvert) Tmplt.QueryCrc_DesIdx =0x80 + (this.queryCrcPara.PlaceIdx & 0x7F);
                else Tmplt.QueryCrc_DesIdx = this.queryCrcPara.PlaceIdx & 0x7F;
                if (this.queryCrcPara.StartIdx > 31 || this.queryCrcPara.EndIdx > 31)
                {
                    this.UpdateMessage("startIdx and endIdx of queryCrcPara should be less than 32!");
                    return -1;
                }

                if (this.queryCrcPara.StartIdx > Tmplt.QueryCmdLen - 1 || this.queryCrcPara.EndIdx > Tmplt.QueryCmdLen - 1)
                {
                    this.UpdateMessage(`"startIdx " + ${this.queryCrcPara.StartIdx} + "or endIdx of queryCrcPara " + ${this.queryCrcPara.EndIdx} + "is out of range of query cmd!"`);
                    return -1;
                }
            } else {
                Tmplt.QueryCrc_CalcIdx = 0xFF;
            }

            // 设置查询条件
            Tmplt.QueryCond = JS_ConstString.GetQueryCond(this.queryCond);
            if (this.tagChecklist) {
                for (let tag of this.tagChecklist){
                    Tmplt.lstTagIdx = Utility.bufferPush(Tmplt.lstTagIdx,this._BllPara.InsertTag(tag))
                }
                Tmplt.TagNum = Tmplt.lstTagIdx.length;
            } else  {
                Tmplt.TagNum = 0;
            }

            if(this.caculist) {
                for (let i=0;i<this.caculist.length;i++){
                    this.caculist[i].SetBllPara(this._BllPara)
                    let idx=this.caculist[i].GetCvtRule()
                    if (idx<0){
                        this.UpdateMessage(`"wrong format of caculist[" + ${i} + "]:" + ${cvt.CvtRule}`);
                        return -1;
                    }
                    Tmplt.lstCvtIdx=Utility.bufferPush(Tmplt.lstCvtIdx,idx);
                }
                Tmplt.CvtNum = Tmplt.lstCvtIdx.length;
            } else {
                Tmplt.CvtNum = 0;
            }
            if (this.copyList){
                for (const js_rule of this.copyList){
                    let rule=  js_rule.GetCopyRule()
                    if (!rule){
                        this.UpdateMessage(`"wrong format of copy rule: " + ${js_rule}`);
                        return -1;
                    }
                    if(rule.srcBuffer==="fw"&&(rule.srcIdx+rule.len>18))
                    {
                        this.UpdateMessage(`"data copyed is protected: "+${js_rule}`);
                        return -1;
                    }
                    Tmplt.lstCopyIdx=Utility.bufferPush(Tmplt.lstCopyIdx,this._BllPara.InsertCopyRule(rule));
                }
                Tmplt.CopyNum = Tmplt.lstCopyIdx.length;
            }
            else Tmplt.CopyNum = 0;
            return this._BllPara.InsertQueryTmplt(Tmplt);
        } catch (error) {
            this.UpdateMessage(`Error in GetQuTmplt: ${error.message}`);
            return -1;
        }
    }
}
// let xtest=new MT_quEvent( JSON.parse(`{
//                 "name": "Qu_IU",
//                 "cmdBuffer": "01 03 00 06 00 2F 64 0B",
//                 "ackBuffer": "01 03 5E 43 5D 19 9A 43 5E 33 33 43 5F 4C CD 00 00 00 00 00 00 00 00 00 00 00 00 3F 8C CC CD 40 0C CC CD 40 53 33 33 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 41 31 99 9A 41 B1 99 9A 42 05 33 33 42 31 F6 1A",
//                 "queryPeriod": {
//                     "periodValue": 300,
//                     "unit": "s"
//                 },
//                 "ackCrcPara": {
//                     "Mode": "crc16",
//                     "Poly": "a001",
//                     "CrcLen": 2,
//                     "StartIdx": 0,
//                     "EndIdx": 2,
//                     "PlaceIdx": 1,
//                     "PlaceInvert": true,
//                     "LittleEndian": true
//                 },
//                 "caculist": [
//                     {
//                         "CvtRule": "up[2].3.1.uint=ack.0.1.uint",
//                         "CvtCond": "ontime"
//                     },
//                     {
//                         "CvtRule": "up[2].13.2.uint=ack.3.4.float.b,*10",
//                         "CvtCond": "ontime",
//                         "Repeat": 3
//                     },
//                     {
//                         "CvtRule": "up[2].19.2.uint=ack.27.4.float.b,*10",
//                         "CvtCond": "ontime",
//                         "Repeat": 3
//                     },
//                     {
//                         "CvtRule": "up[2].25.4.uint=ack.51.4.float.b,*100",
//                         "CvtCond": "ontime"
//                     },
//                     {
//                         "CvtRule": "up[2].29.2.uint=ack.75.4.float.b,*1000",
//                         "CvtCond": "ontime"
//                     },
//                     {
//                         "CvtRule": "up[2].9.4.uint=app.28.4.uint.b"
//                     },
//                     {
//                         "CvtRule": "up[2].31.4.uint=ack.83.4.float.b,*10",
//                         "CvtCond": "ontime",
//                         "Repeat": 4,
//                         "ActAfterCvt": "up"
//                     }
//                 ],
//                 "queryCrcPara": {
//                     "Mode": "crc16",
//                     "Poly": "a001",
//                     "CrcLen": 2,
//                     "StartIdx": 0,
//                     "EndIdx": 2,
//                     "PlaceIdx": 1,
//                     "PlaceInvert": true,
//                     "LittleEndian": true
//                 },
//                 "tagChecklist": [
//                     {
//                         "invert": false,
//                         "index": 1,
//                         "tag": "03"
//                     },
//                     {
//                         "invert": false,
//                         "index": 2,
//                         "tag": "5E"
//                     }
//                 ],
//                 "MulDev_NewGrpStart": true
//             }`))
// let bllPara=new MT_BllPara()
// xtest.SetBllPara(bllPara)
// xtest.GetQuPara()
module.exports = MT_quEvent;
