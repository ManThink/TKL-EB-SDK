class JS_RunPara {
    constructor() {
        this.WakeupIn = false;
        this.WakeupOut = false;
        this.BackHaul = "bh_lorawan";
        this.BaudRate = 9600;
        this.StopBits = 1;
        this.DataBits = 8;
        this.Checkbit = "none";
        this.TransparentBit = false;
        this.KeepRx = false;
        this.Battery = false;
        this.Uart1Used = false;
        this.SwUp = false;
        this.TDMA = true;
        this.PowerCtrl = false;
        this.Wait60s = false;
        this.ConfirmDuty = 0;
        this.portPara = 71;
        this.portTransparent = 51;
        this.RstHours = 720;
        this.TimeOffset = 0;
    }

    /**
     * 从 JSON 字符串反序列化运行参数
     * @param {string} jsonStr JSON 字符串
     * @returns {JS_RunPara|null} 反序列化的运行参数对象
     */
    static DeserializeRunPara(jsonStr) {
        if (!jsonStr) return null;

        try {
            // 使用 JSON.parse 解析
            const jsonObj = JSON.parse(jsonStr);

            // 检查是否存在 RunPara 属性
            const runParaData = jsonObj.RunPara;
            if (!runParaData) return null;

            // 创建新的 JS_RunPara 实例并复制属性
            const runPara = new JS_RunPara();
            Object.keys(runParaData).forEach(key => {
                if (runPara.hasOwnProperty(key)) {
                    runPara[key] = runParaData[key];
                }
            });

            return runPara;
        } catch (error) {
            console.error('Error deserializing RunPara:', error);
            return null;
        }
    }

    /**
     * 将运行参数转换为字节数组
     * @returns {Buffer} 字节数组
     */
    ToBytes() {
        // 创建字节数组缓冲区
        const lstBytes = Buffer.alloc(16, 0);
        let offset = 0;

        // 第一个字节固定为 0
        offset = lstBytes.writeUInt8(0, offset);

        // 第二个字节：唤醒和回程方式
        let backhaul = 0;
        if (this.BackHaul === "bh_lorawan") backhaul = 0;
        else if (this.BackHaul === "bh_4g") backhaul = 1;

        const wakeupByte =
            (this.WakeupIn ? 1 : 0) |
            ((this.WakeupOut ? 1 : 0) << 1) |
            (backhaul << 4);
        offset = lstBytes.writeUInt8(wakeupByte, offset);

        // 波特率
        offset = lstBytes.writeUInt8(this.BaudRate / 1200, offset);

        // 数据位、停止位和校验位
        let check = 0;
        if (this.Checkbit === "odd") check = 1;
        else if (this.Checkbit === "even") {
            this.DataBits = 9;
            check = 2;
        }

        const serialByte =
            this.DataBits |
            (this.StopBits << 4) |
            (check << 6);
        offset = lstBytes.writeUInt8(serialByte, offset);

        // 标志位
        const flagByte =
            (this.KeepRx ? 1 : 0) |
            ((this.Battery ? 1 : 0) << 1) |
            ((this.Uart1Used ? 1 : 0) << 2) |
            ((this.TransparentBit ? 1 : 0) << 3) |
            ((this.SwUp ? 1 : 0) << 4) |
            ((this.TDMA ? 1 : 0) << 5) |
            ((!this.PowerCtrl ? 1 : 0) << 6) |
            ((this.Wait60s ? 1 : 0) << 7);
        offset = lstBytes.writeUInt8(flagByte, offset);

        // 确认占空比
        offset = lstBytes.writeUInt8(this.ConfirmDuty, offset);

        // 端口参数
        offset = lstBytes.writeUInt8(this.portPara, offset);
        offset = lstBytes.writeUInt8(this.portTransparent, offset);

        // 重置小时数（16位）
        offset = lstBytes.writeUInt16LE(this.RstHours, offset);

        // 时间偏移（32位）
        offset = lstBytes.writeUInt32LE(this.TimeOffset, offset);

        return lstBytes;
    }
}

module.exports = JS_RunPara;