const MT_IdxPara = require('./eb-lang-idxPara');

class MT_UpParaHdr {
    static Size =12
    constructor(data = {}) {
        this.UpTmpltLen = data.UpTmpltLen ?? 0;
        this.ConfirmDuty = data.ConfirmDuty ?? 0;
        this.UpPort = data.UpPort ?? 0;
        this.CrcIdx = data.CrcIdx ?? new MT_IdxPara();
        this.UpPeriod =data.UpPeriod ?? 0;
        this.CvtNum = data.CvtNum ?? 0;
        this.Type =data.Type ?? 0;
        this.txstatus = data.txstatus ?? 0;
        this.CrcCalIdx = data.CrcCalIdx ?? 0;
        this.CopyNum = data.CopyNum ?? 0;
        this.unfixLen = data.unfixLen ?? 0;
        this.CrcEndian = data.CrcEndian ?? 0;
        this.UpCond = data.UpCond ?? 0;
        this.Resv2 = data.Resv2 ?? Buffer.alloc(3);
    }
    // 转换为字节数组
    toBytes() {
        const lstBytes = Buffer.alloc(this.Size);

        // 基本字节
        lstBytes[0] = this.UpTmpltLen;
        lstBytes[1] = this.ConfirmDuty;
        lstBytes[2] = this.UpPort;

        // CrcIdx
        lstBytes[3] = this.CrcIdx.Invert
            ? (0x80 | (this.CrcIdx.Idx & 0x7F))
            : (this.CrcIdx.Idx & 0x7F);

        // UpPeriod (小端序)
        lstBytes[4] = this.UpPeriod & 0xFF;
        lstBytes[5] = (this.UpPeriod >> 8) & 0xFF;

        // CvtNum, Type, txstatus
        lstBytes[6] =
            (this.CvtNum & 0xF) |
            ((this.Type & 0x07) << 4) |
            (this.txstatus << 7);

        // CrcCalIdx, CopyNum
        lstBytes[7] =
            (this.CrcCalIdx & 0x0F) |
            (this.CopyNum << 4);

        // unfixLen, CrcEndian, UpCond
        lstBytes[8] =
            (this.unfixLen & 0x01) |
            ((this.CrcEndian & 0x01) << 1) |
            ((this.UpCond & 0x07) << 2);

        // Resv2
        lstBytes[9] = this.Resv2[0];
        lstBytes[10] = this.Resv2[1];
        lstBytes[11] = this.Resv2[2];

        return lstBytes;
    }
}

module.exports = MT_UpParaHdr;
