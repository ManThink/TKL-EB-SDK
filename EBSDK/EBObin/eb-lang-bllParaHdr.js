class MT_BllParaHdr {
    // 静态属性
    static Size = 16;
    static HdrStart = 0x55;

    constructor() {
        // 实例属性
        this.CopyNum = 0;
        this.BllParaLen = 0;
        this.TableNum = 0;
        this.QueryParaNum = 0;
        this.QueryTmpltNum = 0;
        this.TagNum = 0;
        this.CvtNum = 0;
        this.UpTmpltNum = 0;
        this.CrcCalcNum = 0;//number of calculations for crc
        this.OpNum = 0;
        this.OpRulePadding = 0;//the sizeof on oprule is 5 bytes.to ensure the length of all oprules if times of 4,should padd
        this.Resv = Buffer.alloc(3);
    }

    // 转换为字节数组的方法
    ToBytes() {
        // 创建一个 16 字节的 Buffer
        const buffer = Buffer.alloc(MT_BllParaHdr.Size);

        // 写入固定的起始字节
        buffer.writeUInt8(MT_BllParaHdr.HdrStart, 0);

        // 写入各个字段
        buffer.writeUInt8(this.CopyNum, 1);

        // 16位无符号整数（小端序）
        buffer.writeUInt16LE(this.BllParaLen, 2);

        buffer.writeUInt8(this.TableNum, 4);
        buffer.writeUInt8(this.QueryParaNum, 5);
        buffer.writeUInt8(this.QueryTmpltNum, 6);
        buffer.writeUInt8(this.TagNum, 7);
        buffer.writeUInt8(this.CvtNum, 8);
        buffer.writeUInt8(this.UpTmpltNum, 9);
        buffer.writeUInt8(this.CrcCalcNum, 10);
        buffer.writeUInt8(this.OpNum, 11);

        // OpRulePadding 只取低 2 位
        buffer.writeUInt8(this.OpRulePadding & 0x3, 12);

        // 写入保留字节
        this.Resv.forEach((byte, index) => {
            buffer.writeUInt8(byte, 13 + index);
        });

        return buffer;
    }
}
// 导出类
module.exports = MT_BllParaHdr;