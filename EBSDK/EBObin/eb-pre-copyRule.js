const MT_CopyRule = require('./eb-lang-copyRule');
const JS_ConstString = require('./eb-lang-const');
const MT_BllPara =require('./eb-lang-bllPara')
/*
{
   "CopyRule":"up[1].5=ack[0].3.2.[step].[groupSize]",
   "CopyCond":"ontime",
   "GroupSize":1,
   "GroupInvert":false
  }
 */
class JS_CopyRule {
    constructor(data={}) {
        this.CopyRule = data.CopyRule ?? '';
        this.CopyCond = data.CopyCond ?? 'none';
        this.GroupSize = data.GroupSize ?? 1;
        this.GroupInvert =data.GroupInvert ?? false;
    }
    static fromJSON(json) {
        return new JS_CopyRule(json);
    }

    // 私有方法：解析字符串
     static #getBuf(str) {
        const IdxPre = str.indexOf('[');
        const IdxSuf = str.indexOf(']');

        if (IdxPre > 0 && IdxSuf > 0) {
            const idxStr = str.substring(IdxPre + 1, IdxSuf);
            const idx = parseInt(idxStr, 10);

            if (isNaN(idx)) return null;

            return [str.substring(0, IdxPre), idx];
        } else {
            return [str, 0];
        }
    }
// 主方法：获取拷贝规则
    //up[1].5=ack[0].3.2.step.groupSize
    //step groupSize 为可选,规则中的groupSize会被配置中的groupSize替代
    //copyCond invert 为默认
    GetCopyRule() {
        const Strs = this.CopyRule.split('=');

        if (!Strs || Strs.length !== 2) return null;

        const Rule = new MT_CopyRule();
        const LeftStr = Strs[0];
        const RightStr = Strs[1];

        // 处理目标部分
        const LeftStrs = LeftStr.split('.');
        if (!LeftStrs || LeftStrs.length !== 2) return null;

        Rule.desIdx = parseInt(LeftStrs[1]);
        if (isNaN(Rule.desIdx)) return null;

        const LeftObjBuf = JS_CopyRule.#getBuf(LeftStrs[0]);
        if (!LeftObjBuf || JS_ConstString.GetCvtBufIdx(LeftObjBuf[0]) < 0) return null;

        Rule.desBuffer = LeftObjBuf[0];
        Rule.desIdx=MT_BllPara.CalIdxOffset(Rule.desIdx, Rule.desBuffer);
        Rule.desTmpltIdx = LeftObjBuf[1];

        // 处理源部分
        const RightStrs = RightStr.split('.');
        if (!RightStrs || RightStrs.length < 3) return null;

        Rule.srcIdx = parseInt(RightStrs[1]);
        Rule.len = parseInt(RightStrs[2]);
        if (isNaN(Rule.srcIdx) || isNaN(Rule.len)) return null;

        const RightObjBuf = JS_CopyRule.#getBuf(RightStrs[0]);
        if (!RightObjBuf || JS_ConstString.GetCvtBufIdx(RightObjBuf[0]) < 0) return null;

        Rule.srcBuffer = RightObjBuf[0];
        Rule.srcIdx=MT_BllPara.CalIdxOffset(Rule.srcIdx, Rule.srcBuffer);
        Rule.srcTmpltIdx = RightObjBuf[1];

        // 可选参数处理
        if (RightStrs.length >= 4) {
            Rule.step = parseInt(RightStrs[3]);
            if (isNaN(Rule.step)) return null;
        }

        if (RightStrs.length >= 5) {
            Rule.groupSize = parseInt(RightStrs[4]);
            if (isNaN(Rule.groupSize)) return null;
        }

        // 设置其他属性
        Rule.copyCond = this.CopyCond;
        Rule.groupSize = this.GroupSize;
        Rule.invert = this.GroupInvert;

        return Rule;
    }
}
/*
let xtest= new JS_CopyRule(JSON.parse(`{
   "CopyRule":"up[1].5=ack[0].3.2.2",
   "CopyCond":"ontime",
   "GroupSize":1,
   "GroupInvert":false
  }`))
xtest.GetCopyRule()
 */
module.exports = JS_CopyRule;