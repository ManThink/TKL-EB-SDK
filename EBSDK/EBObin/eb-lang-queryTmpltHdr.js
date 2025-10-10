const MT_IdxPara = require('./eb-lang-idxPara');
const {MT_CrcPara} = require("./eb-lang-crcPara");
class MT_QueryTmpltHdr {
    static Size = 12;

    constructor(data = {}) {
        this.QueryCmdLen = data.QueryCmdLen ?? 0;
        this.TagNum = data.TagNum ?? 0;
        this.CvtNum = data.CvtNum ?? 0;
        this.QueryCrc_DesIdx = data.QueryCrc_DesIdx ?? new MT_IdxPara();
        this.AckCrc_DesIdx = data.AckCrc_DesIdx ?? new MT_IdxPara();
        this.QueryCrc_CalcIdx = data.QueryCrc_CalcIdx ?? 0;
        this.AckCrc_CalIdx = data.AckCrc_CalIdx ?? 0;
        this.QueryCrc_Endian = data.QueryCrc_Endian ?? false;
        this.QueryCond = data.QueryCond ?? 0;
        this.CopyNum = data.CopyNum ?? 0;
        this.AckCrc_Endian = data.AckCrc_Endian ?? 0;
        this.Resv1 = data.Resv1 ?? 0;
        this.AckLen = data.AckLen ?? 0;
        this.FixedTime = data.FixedTime ?? 0;
        this.FixedAcq = data.FixedAcq ?? false;
        this.IFSelect = data.IFSelect ?? 0;
    }

    // 转换为字节数组
    toBytes() {
        const bytes = Buffer.alloc(MT_QueryTmpltHdr.Size);

        // QueryCmdLen
        bytes[0] = this.QueryCmdLen;

        // TagNum and CvtNum
        bytes[1] = (this.TagNum & 0x0F) | (this.CvtNum << 4);

        // QueryCrc_DesIdx
        bytes[2] = this.QueryCrc_DesIdx.Invert
            ? (0x80 | (this.QueryCrc_DesIdx.Idx & 0x7F))
            : (this.QueryCrc_DesIdx.Idx & 0x7F);

        // AckCrc_DesIdx
        bytes[3] = this.AckCrc_DesIdx.Invert
            ? (0x80 | (this.AckCrc_DesIdx.Idx & 0x7F))
            : (this.AckCrc_DesIdx.Idx & 0x7F);

        // QueryCrc_CalcIdx and AckCrc_CalIdx
        bytes[4] = (this.QueryCrc_CalcIdx & 0x0F) | (this.AckCrc_CalIdx << 4);

        // QueryCrc_Endian, QueryCond, and CopyNum
        bytes[5] = (this.QueryCrc_Endian ? 1 : 0) |
            ((this.QueryCond & 0x07) << 1) |
            (this.CopyNum << 4);

        // AckCrc_Endian
        bytes[6] = this.AckCrc_Endian ? 1 : 0;

        // AckLen
        bytes[7] = this.AckLen;

        // FixedTime (小端序)
        bytes[8] = this.FixedTime & 0xFF;
        bytes[9] = (this.FixedTime >> 8) & 0xFF;
        bytes[10] = (this.FixedTime >> 16) & 0xFF;

        // FixedAcq and IFSelect
        bytes[11] = ((this.FixedTime >> 24) & 0x7) |
            (this.FixedAcq ? (1 << 3) : 0) |
            (this.IFSelect << 4);

        return bytes;
    }
}
module.exports = MT_QueryTmpltHdr;