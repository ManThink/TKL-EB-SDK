const  MT_DataInfo  = require('./eb-lang-dataInfo');
const  { MT_OpRuleB,MT_OpRule} = require('./eb-lang-optRule');
const JS_ConstString = require('./eb-lang-const');
const MT_BllPara =require('./eb-lang-bllPara')
const  MT_CvtRule  = require('./eb-lang-cvtRule'); // 假设存在这个模块
const Utility=require('./eb-utility')

/*
{
  "CvtRule": "up[2].31.4.uint=ack.83.4.float.b,*10",
  "CvtCond": "ontime",
  "Repeat": 4,
  "ActAfterCvt": "up"
}
 */
class JS_CvtRule  {
    constructor(data={}) {
        this.CvtRule = data.CvtRule ?? '';
        this.CvtCond =data.CvtCond ?? 'none';
        this.ActAfterCvt = data.ActAfterCvt ?? 'none'; // none,up,up1,rm_qu,rm_up
        this.Repeat = data.Repeat ?? 1;
        this.BllPara = new MT_BllPara();
    }
    static fromJSON(json) {
        return new JS_CvtRule(json);
    }
    /**
     * 设置 BllPara
     * @param {MT_BllPara} para BllPara 对象
     */
    SetBllPara(para) {
        this.BllPara = para;
    }
    //qu[0].10.1.uint.b
    //大小端，默认是little endian，有配置的话就是big endian 无论配置的内容是什么
     #getDataInfoFromExpression(DataStr){
        // 处理复杂数据格式
        let Info=new MT_DataInfo()
        const DataStrs = DataStr.split('.');
        if (!DataStrs || (DataStrs.length !== 4 && DataStrs.length !== 5)) {
            return null;
        }
        // 处理模板索引
        const Start = DataStrs[0].indexOf('[');
        const End = DataStrs[0].indexOf(']');
        let BufSelectStr = DataStrs[0];

        if (Start > -1 && End > -1) {
            Info.TmpltIdx = parseInt(DataStrs[0].substring(Start + 1, End));
            if (isNaN(Info.TmpltIdx)) return null;
            BufSelectStr = DataStrs[0].substring(0, Start);
        }

        // 设置其他信息
        Info.BufSelect = JS_ConstString.GetCvtBufIdx(BufSelectStr);
        Info.StartIdx = parseInt(DataStrs[1]);
        Info.DataLen = parseInt(DataStrs[2]);

        let StartIdx = Info.StartIdx;
        StartIdx=MT_BllPara.CalIdxOffset(StartIdx, BufSelectStr);
        Info.StartIdx = StartIdx;
        Info.DataType = JS_ConstString.GetDataTypeIdx(DataStrs[3]);

        if (DataStrs.length > 4) {
            Info.Endian = 1;
        }
        return Info
    }
     #getDataInfoFromInt(ITemp){
        let Info=new MT_DataInfo()
        Info.BufSelect = JS_ConstString.GetCvtBufIdx('table');

        // 确定数据类型
        Info.DataType = ITemp < 0
            ? JS_ConstString.GetDataTypeIdx('int')
            : JS_ConstString.GetDataTypeIdx('uint');

        // 确定数据长度和存储
        const buffers = [
            { min: -128, max: 256, len: 1 },
            { min: -32768, max: 65536, len: 2 },
            { min: -2147483648, max: 4294967296, len: 4 }
        ];

        for (const buf of buffers) {
            if (ITemp<buf.min ) continue
            if (ITemp > buf.max) continue
            const xbuffer = Buffer.alloc(buf.len);
            if (ITemp<0){
                if (buf.len===1) xbuffer.writeInt8(ITemp, 0, buf.len);
                else if (buf.len===2) xbuffer.writeInt16LE(ITemp, 0, buf.len);
                else if (buf.len===4) xbuffer.writeInt32LE(ITemp, 0, buf.len);
            }else{
                if (buf.len===1)        xbuffer.writeUInt8(ITemp, 0, buf.len);
                else if (buf.len===2)   xbuffer.writeUInt16LE(ITemp, 0, buf.len);
                else if (buf.len===4)   xbuffer.writeUInt32LE(ITemp, 0, buf.len);
            }
            Info.StartIdx = this.BllPara.ConstTable.InsertConst(xbuffer);
            Info.DataLen = buf.len;
            return Info;
        }
        // 对于超大数值
        const xbuffer = Buffer.alloc(8);
        xbuffer.writeBigInt64LE(BigInt(ITemp));
        Info.StartIdx = this.BllPara.ConstTable.InsertConst(xbuffer);
        Info.DataLen = 8;
        return Info;
    }

     #getDataInfoFromFloat(FTemp){
        let Info=new MT_DataInfo()
        Info.BufSelect = JS_ConstString.GetCvtBufIdx('table');
        Info.DataType = JS_ConstString.GetDataTypeIdx('float');
        const buffer = Buffer.alloc(4);
        buffer.writeFloatLE(FTemp);
        Info.StartIdx = this.BllPara.ConstTable.InsertConst(buffer);
        Info.DataLen = 4;
        return Info;
    }
    /**
     * 获取数据信息
     * @param {string} DataStr 数据字符串
     * @returns {MT_DataInfo|null} 数据信息对象
     * //qu[0].10.1.uint.b
     */
    GetDataInfo(DataStr) {
        let Info = new MT_DataInfo();
        // 尝试解析整数
        const isMumberStr=Utility.isNumberStr(DataStr)
        if(!isMumberStr){
            return this.#getDataInfoFromExpression(DataStr)
        }
        const FTemp = parseFloat(DataStr);
        if(isNaN(FTemp)) return null
        if (Number.isInteger(FTemp)) {
            return this.#getDataInfoFromInt(FTemp)
        }
        // 尝试解析浮点数
        return this.#getDataInfoFromFloat(FTemp)
    }
    /**
     * 获取操作规则
     * @param {string} inputstr 输入字符串
     * @returns {MT_OpRule|null} 操作规则
     * //比如：*10,*1.5,*6,*ack.4.2.uint.big(大端),*ack.4.2.uint(小端)
     */
    GetOpRule(inputstr) {
        let OpRule = new MT_OpRule();
        let Idx =-1;
        let max
        let i

        inputstr = inputstr.replace(/\s/g, '');

        if (inputstr.length>3) max=3
        else if (inputstr.length>2) max=2
        else max=1

        for ( i=max;i>0;i--){
            Idx = JS_ConstString.GetOpIdx(inputstr.substring(0, i));
            if (Idx>-1) break
        }
        if (Idx <0) {
            this.UpdateMessage('Invalid operator');
            return null;
        }
        OpRule.Operator = Idx;
        const RightObj = inputstr.substring(i);
        OpRule.DataInfo = this.GetDataInfo(RightObj);
        return OpRule;
    }

    /**
     * 获取操作规则列表
     * @param {string[]} OpStrList 操作字符串列表
     * @returns {number[]|null} 操作规则索引列表
     */
    GetOpRuleList(OpStrList) {
        if (!OpStrList || OpStrList.length < 1) return null;

        return OpStrList.map(op => {
            const rule = this.GetOpRule(op);
            return this.BllPara.InsertOpRule(rule);
        });
    }

    /**
     * 更新消息
     * @param {string} msg 消息内容
     */
    UpdateMessage(msg) {
        console.log(`[message] ${msg}`);
    }
    /**
     * 获取转换规则
     * @returns {number} 转换规则索引
     */
    GetCvtRule() {
        const Rule = new MT_CvtRule();

        // 转换条件和动作
        Rule.CvtCond = JS_ConstString.GetCvtCondIdx(this.CvtCond);
        Rule.ActionAfterCvt = JS_ConstString.GetActionIdx(this.ActAfterCvt);

        // 处理转换规则字符串
        this.CvtRule = this.CvtRule.replace(/\s/g, '').toLowerCase();
        const EqualIndx = this.CvtRule.indexOf('=');

        // 验证规则格式
        if (EqualIndx < 1) {
            this.UpdateMessage(`Wrong format of convert rule: ${this.CvtRule}`);
            return -1;
        }

        const RuleStr = [
            this.CvtRule.substring(0, EqualIndx),
            this.CvtRule.substring(EqualIndx + 1)
        ];

        // 解析目标数据
        const DesData = this.GetDataInfo(RuleStr[0]);
        if (!DesData) {
            this.UpdateMessage(`Wrong format of destination data: ${RuleStr[0]}`);
            return -1;
        }

        // 解析源数据和操作规则
        const RightObjs = RuleStr[1].split(',');
        if (!RightObjs || RightObjs.length < 1) {
            this.UpdateMessage(`Wrong format of operation rule: ${RuleStr[1]}`);
            return -1;
        }

        const SrcData = this.GetDataInfo(RightObjs[0]);
        if (!SrcData) {
            this.UpdateMessage(`Wrong format of source data: ${RightObjs[0]}`);
            return -1;
        }

        // 获取操作规则列表
        const lstOp = this.GetOpRuleList(RightObjs.slice(1));

        // 验证操作规则数量
        if (lstOp && lstOp.length > 6) {
            this.UpdateMessage(`Count of operation rules should not be more than 6: ${RuleStr[1]}`);
            return -1;
        }

        // 设置操作规则
        if (lstOp && lstOp.length > 0) {
            Rule.OpNum = lstOp.length;
            Rule.OpIdx = new Array(6).fill(0); // 初始化一个长度为6的数组
            lstOp.forEach((op, i) => {
                Rule.OpIdx[i] = op;
            });
        }

        // 设置源数据和目标数据
        Rule.SrcData = SrcData;
        Rule.DesData = DesData;

        // 设置重复次数
        this.Repeat = this.Repeat < 1 ? 1 : this.Repeat;
        Rule.Repeat = this.Repeat - 1;

        // 插入转换规则并返回索引
        return this.BllPara.InsertCvtRule(Rule);
    }
}
/*
let xtest=new JS_CvtRule( JSON.parse(`{
  "CvtRule": "up[2].31.4.uint=ack.83.4.float.b,*10,+5.3",
  "CvtCond": "ontime",
  "Repeat": 4,
  "ActAfterCvt": "up"
}`))
let bllPara=new MT_BllPara()
xtest.SetBllPara(bllPara)
xtest.GetCvtRule()


xtest.GetOpRule("dic200")
xtest.GetOpRule("!=10.2")
xtest.GetOpRule("*-3.5")
xtest.GetOpRule("+2")
xtest.GetOpRule("+")
xtest.GetOpRule("*ack.4.2.uint.big")
xtest.GetOpRule("*up.2.2.int.big")
 */

module.exports = JS_CvtRule;
