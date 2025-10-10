const MT_DataInfo =require('./eb-lang-dataInfo')
class MT_CvtRule {
    constructor(data={}) {
        this.SrcData = data.SrcData
            ?MT_DataInfo.fromJSON(data.SrcData)
            :new MT_DataInfo()
        ;
        this.DesData = data.DesData
            ?MT_DataInfo.fromJSON(data.DesData)
            :new MT_DataInfo()
        this.CvtCond = data.CvtCond ?? 0; //0-cvt whenever;1-cvt only when query timeout;2-cvt only when query is not timeout 3~7-resv
        this.ActionAfterCvt = data.ActionAfterCvt ?? 0;//0-no action;1-upload;2-upload according to the result of cvt;3-remove the querytmplt from the eventlis;4-remove the uptmplt from the ev
        this.OpNum = 0;
        this.Repeat = data.Repeat ?? 0;
        this.OpIdx = Buffer.alloc(6);
    }
    static fromJSON(json){
        return new MT_CvtRule(json)
    }

    /**
     * 比较两个 MT_CvtRule 对象是否相等
     * @param {MT_CvtRule} obj 要比较的对象
     * @returns {boolean} 是否相等
     */
    equals(obj) {
        if (!(obj instanceof MT_CvtRule)) return false;

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
        const srcDataBytes = this.SrcData.toBytes();
        const desDataBytes = this.DesData.toBytes();

        const bytes = Buffer.alloc(16);

        // 拷贝源数据和目标数据字节
        srcDataBytes.copy(bytes, 0); // 4字节
        desDataBytes.copy(bytes, 4); // 4字节

        // 第9字节：转换条件和转换后动作
        bytes.writeUInt8(
            (this.CvtCond & 0x07) |
            ((this.ActionAfterCvt & 0x1F) << 3),
            8
        );

        // 第10字节：操作数和重复
        bytes.writeUInt8(
            (this.OpNum & 0x07) |
            ((this.Repeat & 0x1F) << 3),
            9
        );

        // 拷贝操作索引
        for (let i = 0; i < 6; i++) {
            bytes.writeUInt8(this.OpIdx[i], 10 + i);
        }

        return bytes;
    }
}
module.exports = MT_CvtRule;
