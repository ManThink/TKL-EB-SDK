const MT_BllParaHdr = require('./eb-lang-bllParaHdr');
const {ConstData,MT_ConstTable} = require('./eb-lang-constTable');
const MT_QueryPara = require('./eb-lang-queryPara');
const MT_Tag = require('./eb-lang-tag');
const MT_CvtRule = require('./eb-lang-cvtRule');
const MT_CopyRule = require('./eb-lang-copyRule');
const { MT_OpRule,
    MT_OpRuleB} = require('./eb-lang-optRule');
const {
    MT_CrcFunc,
    MT_CrcPara
} = require('./eb-lang-crcPara');
const MT_QueryTmplt = require('./eb-lang-queryTmplt');
const MT_UpTmplt = require('./eb-lang-upTmplt');

const MT_QueryTmpltHdr = require('./eb-lang-queryTmpltHdr');
const MT_UpParaHdr = require('./eb-lang-upParaHdr');
const Utility=require('./eb-utility')
class MT_BllPara {
    static  PARA_BEGIN = 0x55;
    static  PARA_END = 0xAA;
    static PaddingIdx = 12;

    constructor() {
        this.ParaHdr = new MT_BllParaHdr();
        this.ConstTable = new MT_ConstTable();
        this.lstQueryPara = [].map(val=>new MT_QueryPara());
        this.lstTag = [].map(val=>new MT_Tag());
        this.lstCvtRule = [].map(val=>new MT_CvtRule());
        this.lstCopyRule = [].map(val=> new MT_CopyRule());
        this.lstOpRule = [].map(val=>new MT_OpRule());
        this.lstCrcFunc = [].map(val=>new MT_CrcFunc());
        this.lstQueryTmplt = [].map(val=>new MT_QueryTmplt());
        this.lstUpTmplt = [].map(val=> new MT_UpTmplt());
        this.lstFillIdx = Buffer.alloc(0);
    }
    InsertQueryPara( obj) {
        let i
        for ( i=0;i<this.lstQueryPara.length;i++)
        {
            const val=this.lstQueryPara[i]
            if (!(val instanceof MT_QueryPara)) continue
            if (val.equals(obj)) return i
        }
        this.lstQueryPara.push(obj)
        return i
    }
    InsertTag(obj){
        let i
        for( i=0;i<this.lstTag.length;i++){
            const val=this.lstTag[i]
            if (!(val instanceof  MT_Tag)) continue
            if (val.equals(obj)) return i
        }
         this.lstTag.push(obj)
         return i
    }
    InsertCvtRule(obj){
        let i
        for( i=0;i<this.lstCvtRule.length;i++){
            const val=this.lstCvtRule[i]
            if(!(val instanceof  MT_CvtRule)) continue
            if (val.equals(obj)) return i
        }
        this.lstCvtRule.push(obj)
        return i
    }
    InsertCopyRule(obj){
        let i
        for( i=0;i<this.lstCopyRule.length;i++){
            const val=this.lstCopyRule[i]
            if(!(val instanceof  MT_CopyRule)) continue
            if (val.equals(obj)) return i
        }
        this.lstCopyRule.push(obj)
        return i
    }
    InsertOpRule(obj){
        let i
        for( i=0;i<this.lstOpRule.length;i++){
            const val=this.lstOpRule[i]
            if(!(val instanceof  MT_OpRule)) continue
            if (val.equals(obj)) return i
        }
        this.lstOpRule.push(obj)
        return i
    }
    InsertCrcFunc(obj){
        let func,i
        // if(!(obj instanceof MT_CrcPara)) return 0
        func=new MT_CrcFunc({
            Mode:obj.Mode,
            Poly: parseInt(obj.Poly, 16),
            StartIdx:obj.StartIdx,
            EndIdx:obj.EndIdx,
            CrcLen:obj.CrcLen
        })
        for( i=0;i<this.lstCrcFunc.length;i++){
            const val=this.lstCrcFunc[i]
            if(!(val instanceof  MT_CrcFunc)) continue
            if (val.equals(func)) return i
        }
        this.lstCrcFunc.push(func)
        return i
    }
    InsertQueryTmplt(obj){
        let i
        for( i=0;i<this.lstQueryTmplt.length;i++){
            const val=this.lstQueryTmplt[i]
            if(!(val instanceof  MT_QueryTmplt)) continue
            if (val.equals(obj)) return i
        }
        this.lstQueryTmplt.push(obj)
        return i
    }
    InsertUpTmplt(obj){
        let i
        for( i=0;i<this.lstUpTmplt.length;i++){
            const val=this.lstUpTmplt[i]
            if(!(val instanceof  MT_UpTmplt)) continue
            // if (val.equals(obj)) return i
        }
        this.lstUpTmplt.push(obj)
        return i
    }
    static CalIdxOffset(idx,buf) {
    if (buf === "qu") idx = idx + MT_QueryTmpltHdr.Size;
    else if (buf === "up") idx = idx +  MT_UpParaHdr.Size;
    return idx
   }
    ToBytes() {
        // 创建 Buffer 替代 List<byte>
        let padding=0
        let lstBuffer = new Buffer.alloc(0);

        // 设置各种计数
        this.ParaHdr.CopyNum = this.lstCopyRule.length;
        this.ParaHdr.CrcCalcNum = this.lstCrcFunc.length;
        this.ParaHdr.CvtNum = this.lstCvtRule.length;
        this.ParaHdr.OpNum = this.lstOpRule.length;
        this.ParaHdr.QueryParaNum = this.lstQueryPara.length;
        this.ParaHdr.QueryTmpltNum = this.lstQueryTmplt.length;
        this.ParaHdr.TagNum = this.lstTag.length;
        this.ParaHdr.UpTmpltNum = this.lstUpTmplt.length;

        // 处理常量表
        const TableBytes = this.ConstTable.ToBytes();
        this.ParaHdr.TableNum = TableBytes ? TableBytes.length : 0;

        // 添加 ParaHdr
        lstBuffer=Utility.bufferPush(lstBuffer,...this.ParaHdr.ToBytes());

        // 添加常量表字节
        if (TableBytes) {
            lstBuffer=Utility.bufferPush(lstBuffer,...TableBytes);
        }
        for (const val of this.lstQueryPara){
            if(!(val instanceof MT_QueryPara)) continue
            lstBuffer=Utility.bufferPush(lstBuffer,...val.toBytes())
        }
        for (const val of this.lstCvtRule){
            if(!(val instanceof MT_CvtRule)) continue
            lstBuffer=Utility.bufferPush(lstBuffer,...val.toBytes())
        }
        for (const val of this.lstCrcFunc){
            if(!(val instanceof MT_CrcFunc)) continue
            lstBuffer=Utility.bufferPush(lstBuffer,...val.toBytes())
        }
        for (const val of this.lstCopyRule){
            if(!(val instanceof MT_CopyRule)) continue
            lstBuffer=Utility.bufferPush(lstBuffer,...val.toBytes())
        }
        for (const val of this.lstTag){
            if(!(val instanceof MT_Tag)) continue
            lstBuffer=Utility.bufferPush(lstBuffer,...val.toBytes())
        }
        for (const val of this.lstOpRule){
            if(!(val instanceof MT_OpRule)) continue
            lstBuffer=Utility.bufferPush(lstBuffer,...val.toBytes())
        }
        while (lstBuffer.length % 4 !== 0)
        {
            lstBuffer=Utility.bufferPush(lstBuffer,0);
            padding++;
        }
        lstBuffer[MT_BllPara.PaddingIdx] = (lstBuffer[MT_BllPara.PaddingIdx] & 0x03) + padding;
        let QueryIdx = lstBuffer.length;
        for(let i=0;i<this.lstQueryTmplt.length;i++){
            lstBuffer=Utility.bufferPush(lstBuffer,...[0,0])
        }
        let UpIdx = lstBuffer.length;
        for(let i=0;i<this.lstUpTmplt.length;i++){
            lstBuffer=Utility.bufferPush(lstBuffer,...[0,0])
        }
        while (lstBuffer.length % 4 !== 0) {
            lstBuffer=Utility.bufferPush(lstBuffer,0)

        }
        for(let i=0;i<this.lstQueryTmplt.length;i++){
            let Idx=lstBuffer.length
            lstBuffer[QueryIdx] = Idx & 0xFF;
            lstBuffer[QueryIdx + 1] = (Idx >> 8)&0xFF;
            lstBuffer=Utility.bufferPush(lstBuffer,...this.lstQueryTmplt[i].toBytes());
            QueryIdx = QueryIdx + 2;
        }
        for(let i=0;i<this.lstUpTmplt.length;i++){
            let Idx=lstBuffer.length
            lstBuffer[UpIdx] = Idx & 0xFF;
            lstBuffer[UpIdx + 1] = (Idx >> 8)&0xFF;
            let bData = this.lstUpTmplt[i].toBytes();
            if (bData===null||bData.length===0) {
                break
            }
            lstBuffer=Utility.bufferPush(lstBuffer,...bData)
            UpIdx+=2
        }
        lstBuffer=Utility.bufferPush(lstBuffer,MT_BllPara.PARA_END)
        this.ParaHdr.BllParaLen = lstBuffer.length;
        lstBuffer[2] = this.ParaHdr.BllParaLen & 0xFF; //set the all length of bll para
        lstBuffer[3] = (this.ParaHdr.BllParaLen >> 8)&0xFF; //set the all length of bll para

        return lstBuffer
    }
}

function SaveFile () {

} 

module.exports = MT_BllPara;