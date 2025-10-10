class MT_EBApp {
    constructor(data) {
        // 参数验证
        if (!data || data.length < 8) {
            this.initializeDefaults();
            return;
        }

        // 位运算解析
        this.HardwareType = (data[0] >> 4) | (data[1] << 4);
        this.FuotaVersion = data[0] & 0x0F;
        this.HardwareVersion = data[2] >> 4;
        this.FirmwareVersion = data[3];
        this.SlaveDevType = data[4] | (data[5] << 8);
        this.BllParaVersion = data[6];
    }

    // 默认值初始化
    initializeDefaults() {
        this.HardwareType = 0;
        this.FuotaVersion = 0;
        this.HardwareVersion = 0;
        this.FirmwareVersion = 0;
        this.SlaveDevType = 0;
        this.BllParaVersion = 0;
    }
}
