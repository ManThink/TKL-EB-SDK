const JS_ConstString=require('./eb-lang-const')
class MT_CopyRule {
    constructor(data={}) {
        this.srcIdx = data.srcIdx ?? 0;
        this.desIdx = data.desIdx ?? 0;
        this.len = data.len ?? 0;
        this.invert =data.invert ?? false;
        this.step = data.step ?? 0;
        this.srcBuffer =data.srcBuffer ?? "";
        this.desBuffer = data.desBuffer ?? "";
        this.copyCond = data.copyCond ?? "none";
        this.desTmpltIdx = data.desTmpltIdx ?? 0;
        this.srcTmpltIdx =data.srcTmpltIdx ?? 0;
        this.groupSize = data.groupSize ?? 1;
        this.resv = data.resv ?? 0;
    }
    static fromJSON(json){
        return new MT_CopyRule(json)
    }
    /**
     * 比较两个 MT_CopyRule 对象是否相等
     * @param {MT_CopyRule} obj 要比较的对象
     * @returns {boolean} 是否相等
     */
    equals(obj) {
        if (!(obj instanceof MT_CopyRule)) return false;

        const BytesObj = obj.toBytes();
        const BytesThis = this.toBytes();

        if (!BytesObj || !BytesThis || BytesObj.length !== BytesThis.length) return false;

        return BytesObj.every((byte, index) => byte === BytesThis[index]);
    }

    /**
     * 转换为字节数组
     * @returns {Buffer} 字节数组
     */
    toBytes() {
        const bytes = Buffer.alloc(8);

        // 第1字节：srcIdx
        bytes.writeUInt8(this.srcIdx, 0);

        // 第2字节：desIdx
        bytes.writeUInt8(this.desIdx, 1);

        // 第3字节：len
        bytes.writeUInt8(this.len, 2);

        // 第4字节：源缓冲区和目标缓冲区索引
        const srcBufIdx = JS_ConstString.GetCvtBufIdx(this.srcBuffer);
        const desBufIdx = JS_ConstString.GetCvtBufIdx(this.desBuffer);
        bytes.writeUInt8(
            (srcBufIdx & 0x0F) | ((desBufIdx & 0x0F) << 4),
            3
        );

        // 第5字节：反转、条件和组大小
        let Cond;
        if (isNaN(parseInt(this.copyCond))) {
            Cond = JS_ConstString.GetCvtCondIdx(this.copyCond);
        } else {
            Cond = parseInt(this.copyCond);
        }

        bytes.writeUInt8(
            (this.invert ? 1 : 0) |
            ((Cond & 0x7F) << 1) |
            ((this.groupSize & 0x0F) << 4),
            4
        );

        // 第6字节：目标模板索引和步进
        bytes.writeUInt8(
            (this.desTmpltIdx & 0x3F) |
            ((this.step & 0x03) << 6),
            5
        );

        // 第7字节：源模板索引
        bytes.writeUInt8(this.srcTmpltIdx & 0x3F, 6);
        bytes.writeUInt8(this.resv, 7);

        return bytes;
    }
}
// 导出类
module.exports = MT_CopyRule;