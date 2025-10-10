class MT_BllRunPara {
    constructor() {
        // 初始化默认值
        this.FuotaVersion = 0;
        this.HwType = 0;
        this.HwVersion = 0;
        this.SwVersion = 0;
        this.BzType = 0;
        this.BzVersion = 0;
        this.FilterMask = 0;
        this.OtaMask = 0;
        this.BaudRate = 0;
        this.StopBits = 0;
        this.DataBits = 0;
        this.Checkbit = 0;
        this.TransparentBit = 0;
        this.KeepRx = 0;
        this.Battery = 0;
        this.Uart1Used = 0;
        this.SwUp = 0;
        this.ConfirmDuty = 0;
        this.portPara = 71;
        this.portTransparent = 51;
        this.RstHours = 720;
        this.TimeOffset = 0;
    }

    ToBytes() {
        // 创建一个用于存储字节的缓冲区
        const buffer = Buffer.alloc(20);  // 预估大小，根据实际字节数调整

        // 第一个字节：FuotaVersion + HwType低4位
        buffer.writeUInt8(
            (this.FuotaVersion & 0x0F) | ((this.HwType & 0x0F) << 4),
            0
        );

        // 第二个字节：HwType高4位
        buffer.writeUInt8(
            (this.HwType >> 4) & 0xFF,
            1
        );

        // 第三个字节：固定值3 + HwVersion
        buffer.writeUInt8(
            3 + ((this.HwVersion & 0x0F) << 4),
            2
        );

        // 第四、五个字节：BzType
        buffer.writeUInt16LE(this.BzType, 3);

        // 第六个字节：BzVersion
        buffer.writeUInt8(this.BzVersion, 5);

        // 第七个字节：SwVersion
        buffer.writeUInt8(this.SwVersion, 6);

        // 第八个字节：FilterMask + OtaMask
        buffer.writeUInt8(
            (this.FilterMask & 0x0F) | ((this.OtaMask & 0x0F) << 4),
            7
        );

        // 第九个字节：BaudRate
        buffer.writeUInt8(
            Math.floor(this.BaudRate / 1200),
            8
        );

        // 第十个字节：DataBits + StopBits + Checkbit
        buffer.writeUInt8(
            (this.DataBits & 0x0F) |
            ((this.StopBits & 0x03) << 4) |
            ((this.Checkbit & 0x03) << 6),
            9
        );

        // 第十一个字节：复合位标志
        buffer.writeUInt8(
            (this.KeepRx & 0x01) |
            ((this.Battery & 0x07) << 1) |
            ((this.Uart1Used & 0x01) << 2) |
            ((this.TransparentBit & 0x01) << 3) |
            ((this.SwUp & 0x0F) << 4),
            10
        );

        // 后续字节
        buffer.writeUInt8(this.ConfirmDuty, 11);
        buffer.writeUInt8(this.portPara, 12);
        buffer.writeUInt8(this.portTransparent, 13);

        // RstHours
        buffer.writeUInt16LE(this.RstHours, 14);

        // TimeOffset
        buffer.writeUInt32LE(this.TimeOffset, 16);

        return buffer;
    }
}

// 导出类
module.exports = MT_BllRunPara;
