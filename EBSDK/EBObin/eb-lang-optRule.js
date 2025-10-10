const MT_DataInfo  = require('./eb-lang-dataInfo');
const Utility = require("./eb-utility");
class MT_OpRule {
    constructor(data={}) {
        this.Operator = data.Operator ?? 0;
        this.DataInfo = data.DataInfo ?? new MT_DataInfo();
    }

    // 等价于 Equals 方法
    equals(obj) {
        if (!(obj instanceof MT_OpRule)) return false;

        const bytesObj = obj.toBytes();
        const bytesThis = this.toBytes();

        // 长度不同直接返回 false
        if (bytesObj.length !== bytesThis.length) return false;

        // 逐字节比较
        for (let i = 0; i < bytesObj.length; i++) {
            if (bytesObj[i] !== bytesThis[i]) return false;
        }

        return true;
    }

    // 转换为字节数组
    toBytes() {
        let lstBytes = Buffer.alloc(0);

        // 操作符处理
        lstBytes=Utility.bufferPush(lstBytes,this.Operator & 0x3F);

        // 添加 DataInfo 的字节
        const dataInfoBytes = this.DataInfo.toBytes();
        lstBytes=Utility.bufferPush(lstBytes,...dataInfoBytes);

        return Buffer.from(lstBytes);
    }
}
class MT_OpRuleB {
    constructor(data = {}) {

        this.Operator = data.Operator ?? 0;
        this.tKeyLen = data.tKeyLen ?? 0;
        this.tValueLen = data.tValueLen ?? 0;
        this.tableIndex = data.tableIndex ?? 0;
        this.tKeySigned = data.tKeySigned ?? 0;
        this.tValueSigned = data.tValueSigned ?? 0;
        this.tkeyValueNum = data.tkeyValueNum ?? 0;
    }

    // 转换为字节数组
    toBytes() {
        let lstBytes = Buffer.alloc(0);

        // 第一个字节
        lstBytes=Utility.bufferPush(lstBytes,
            (this.Operator & 0x3F) | ((this.tKeyLen & 0x03) << 6)
        );

        // 第二个字节
        lstBytes=Utility.bufferPush(lstBytes,
            ((this.tKeyLen & 0x1F) >> 2) | (this.tValueLen << 3)
        );

        // 第三个字节
        lstBytes=Utility.bufferPush(lstBytes,
            (this.tableIndex & 0x7F) | (this.tKeySigned << 7)
        );

        // 第四个字节
        lstBytes=Utility.bufferPush(lstBytes,
            (this.tValueSigned & 0x01) | (this.tkeyValueNum << 1)
        );

        return Buffer.from(lstBytes);
    }
}
// 导出类
module.exports = {
    MT_OpRule,
    MT_OpRuleB
};
