const Utility=require('./eb-utility')
class MT_QueryTmplt {
    constructor(data = {}) {
        this.lstQueryCmd = data.lstQueryCmd ?? Buffer.alloc(0);
        this.lstTagIdx = data.lstTagIdx ?? Buffer.alloc(0);
        this.lstCopyIdx = data.lstCopyIdx ?? Buffer.alloc(0);
        this.lstCvtIdx = data.lstCvtIdx ?? Buffer.alloc(0);
        this.QueryCmdLen = data.QueryCmdLen ?? 0;
        this.TagNum = data.TagNum ?? 0;
        this.CvtNum = data.CvtNum ?? 0;
        this.QueryCrc_DesIdx = data.QueryCrc_DesIdx ?? 0;
        this.AckCrc_DesIdx = data.AckCrc_DesIdx ?? 0;
        this.QueryCrc_CalcIdx = data.QueryCrc_CalcIdx ?? 0;
        this.AckCrc_CalcIdx = data.AckCrc_CalcIdx ?? 0;
        this.QueryCrc_LEndian = data.QueryCrc_LEndian ?? false;
        this.QueryCond = data.QueryCond ?? 0;
        this.CopyNum = data.CopyNum ?? 0;
        this.AckCrc_LEndian =data.AckCrc_LEndian ?? false;
        this.AckLen = data.AckLen ?? 0;
        this.FixedMoment = data.FixedMoment ?? 0;
        this.FixedAcq = data.FixedAcq ?? false;
        this.IFSelect = data.IFSelect ?? 0;
        this.CheckLen = data.CheckLen ?? 0;
    }

    // 转换为字节数组
    toBytes() {
        let lstBytes = Buffer.alloc(0);

        lstBytes=Utility.bufferPush(lstBytes,this.QueryCmdLen);

        // TagNum (低4位)
        lstBytes=Utility.bufferPush(lstBytes,this.TagNum & 0xF);

        lstBytes=Utility.bufferPush(lstBytes,this.QueryCrc_DesIdx);
        lstBytes=Utility.bufferPush(lstBytes,this.AckCrc_DesIdx);

        // QueryCrc_CalcIdx 和 AckCrc_CalcIdx
        lstBytes=Utility.bufferPush(lstBytes,
            (this.QueryCrc_CalcIdx & 0x0F) |
            (this.AckCrc_CalcIdx << 4)
        );

        // 第一个 Endian 字节
        lstBytes=Utility.bufferPush(lstBytes,
            (this.QueryCrc_LEndian ? 0 : 1) |
            ((this.QueryCond & 0x7) << 1) |
            (this.CopyNum << 4)
        );

        // 第二个 Endian 字节
        lstBytes=Utility.bufferPush(lstBytes,
            (this.AckCrc_LEndian ? 0 : 1) |
            ((this.CvtNum & 0x7F) << 1)
        );

        lstBytes=Utility.bufferPush(lstBytes,this.AckLen);


        
        // 最后一个复合字节
        const Temp = (
            (this.FixedMoment & 0x7FFFFFF) |
            (this.FixedAcq ? (1 << 27) : 0) |
            ((this.IFSelect & 0x07) << 28) |
            (this.CheckLen << 31  >>> 0)
        ) >>> 0;
        // 写入 Temp (小端序)
        const tempBuffer = Buffer.alloc(4);
        tempBuffer.writeUInt32LE(Temp, 0);
        lstBytes=Utility.bufferPush(lstBytes,...tempBuffer);

        // 添加各个列表
        if (this.lstQueryCmd) lstBytes=Utility.bufferPush(lstBytes,...this.lstQueryCmd);
        if (this.lstTagIdx) lstBytes=Utility.bufferPush(lstBytes,...this.lstTagIdx);
        if (this.lstCvtIdx) lstBytes=Utility.bufferPush(lstBytes,...this.lstCvtIdx);
        if (this.lstCopyIdx) lstBytes=Utility.bufferPush(lstBytes,...this.lstCopyIdx);

        // 确保总长度是 4 的倍数
        while (lstBytes.length % 4 !== 0) {
            lstBytes=Utility.bufferPush(lstBytes,0);
        }

        return Buffer.from(lstBytes);
    }

    // 比较方法
    equals(obj) {
        if (!(obj instanceof MT_QueryTmplt)) return false;

        const bytesObj = obj.toBytes();
        const bytesThis = this.toBytes();

        // 长度不同直接返回 false
        if (bytesObj.length !== bytesThis.length) return false;

        // 逐字节比较
        return Buffer.compare(bytesObj, bytesThis) === 0;
    }
}

module.exports = MT_QueryTmplt;