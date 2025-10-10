const JS_ConstString=require('./eb-lang-const')
class MT_DataInfo {
    constructor(data={}) {
        this.BufSelect = data.BufSelect ?? 0;     // 缓冲区选择
        this.DataLen =data.DataLen ?? 0;       // 数据长度
        this.StartIdx = data.StartIdx ?? 0;      // 起始索引
        this.DataType =data.DataType ?? 0;      // 数据类型
        this.Endian = data.Endian ?? 0;        // 字节序
        this.TmpltIdx = data.TmpltIdx ?? 0;      // 模板索引
    }
    static fromJSON(json) {
        return new MT_DataInfo(json);
    }
    /**
     * 转换为字节数组
     * @returns {Buffer} 字节数组
     */
    toBytes() {
        const bytes = Buffer.alloc(4);

        // 第1字节：缓冲区选择和数据长度
        bytes.writeUInt8(
            (this.BufSelect & 0x0F) |
            ((this.DataLen & 0x0F) << 4),
            0
        );

        // 第2字节：起始索引
        bytes.writeUInt8(this.StartIdx, 1);

        // 第3字节：数据类型和字节序
        bytes.writeUInt8(
            (this.DataType & 0x0F) |
            ((this.Endian & 0x01) << 4),
            2
        );

        // 第4字节：模板索引
        bytes.writeUInt8(
            this.TmpltIdx & 0x3F,
            3
        );

        return bytes;
    }
    /**
     * 比较两个 MT_DataInfo 对象是否相等
     * @param {MT_DataInfo} other 要比较的对象
     * @returns {boolean} 是否相等
     */
    equals(other) {
        if (!(other instanceof MT_DataInfo)) return false;

        return (
            this.BufSelect === other.BufSelect &&
            this.DataLen === other.DataLen &&
            this.StartIdx === other.StartIdx &&
            this.DataType === other.DataType &&
            this.Endian === other.Endian &&
            this.TmpltIdx === other.TmpltIdx
        );
    }
}
// 导出类
module.exports = MT_DataInfo;
