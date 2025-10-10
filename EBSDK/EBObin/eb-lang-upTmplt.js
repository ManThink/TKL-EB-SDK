const JS_ConstString=require('./eb-lang-const')
const MT_Period =require('./eb-lang-period')
const Utility=require('./eb-utility')
class MT_UpTmplt {
    constructor(data = {}) {
        this.TmpltLen = data.TmpltLen ?? 0;
        this.ConfirmDuty = data.ConfirmDuty ?? 0;
        this.Port = data.Port ?? 0;
        this.CrcIdx =data.CrcIdx ?? 0;
        this.Period = data.Period ?? new MT_Period();
        this.CvtNum = data.CvtNum ?? 0;
        this.Type = data.Type ?? 0;
        this.TxStatus = data.TxStatus ?? 0;
        this.CrcFuncIdx =data.CrcFuncIdx ?? 15;
        this.CopyNum = data.CopyNum ?? 0;
        this.UnFixLen = data.UnFixLen ?? 0;
        this.CrcLEndian = data.CrcLEndian ?? false;
        this.UpCond = data.UpCond ?? 0;
        this.Resv = data.Resv ?? Buffer.alloc(3);

        // 验证并初始化列表
        this.lstUpData = data.lstUpData ?? Buffer.alloc(0);
        this.lstCopyIdx = data.lstCvtIdx ?? Buffer.alloc(0);
        this.lstCvtIdx =data.lstCvtIdx ?? Buffer.alloc(0);
    }
    // 转换为字节数组
    toBytes() {
        let lstBytes = Buffer.alloc(0);

        // 基本字段
        lstBytes=Utility.bufferPush(lstBytes,this.TmpltLen);
        lstBytes=Utility.bufferPush(lstBytes,this.ConfirmDuty);
        lstBytes=Utility.bufferPush(lstBytes,this.Port);
        lstBytes=Utility.bufferPush(lstBytes,this.CrcIdx);

        // 处理周期
        const unitIdx = JS_ConstString.GetUnitIdx(this.Period.unit);
        if (unitIdx < 0) {
            throw new Error('Invalid period unit');
        }

        const period = (
            (this.Period.periodValue & 0x3FFF) |
            (unitIdx << 14)
        );

        // 小端序处理周期
        lstBytes=Utility.bufferPush(lstBytes,period & 0xFF);
        lstBytes=Utility.bufferPush(lstBytes,(period >> 8) & 0xFF);

        // CvtNum, Type, TxStatus
        lstBytes=Utility.bufferPush(lstBytes,
            (this.CvtNum & 0x0F) |
            ((this.Type & 0x07) << 4) |
            (this.TxStatus << 7)
        );

        // CrcFuncIdx, CopyNum
        lstBytes=Utility.bufferPush(lstBytes,
            (this.CrcFuncIdx & 0x0F) |
            (this.CopyNum << 4)
        );

        // UnFixLen, CrcLEndian, UpCond
        const endianBit = this.CrcLEndian ? 0 : 1;
        lstBytes=Utility.bufferPush(lstBytes,
            (this.UnFixLen & 0x01) |
            (endianBit << 1) |
            ((this.UpCond & 0x07) << 2)
        );

        // 保留字节
        lstBytes=Utility.bufferPush(lstBytes,...this.Resv);

        // 验证 CopyIdx 和 CvtIdx 数量
        if (this.lstCopyIdx.length !== this.CopyNum) {
            throw new Error(`CopyIdx count (${this.lstCopyIdx.length}) does not match CopyNum (${this.CopyNum})`);
        }
        if (this.lstCvtIdx.length !== this.CvtNum) {
            throw new Error(`CvtIdx count (${this.lstCvtIdx.length}) does not match CvtNum (${this.CvtNum})`);
        }

        // 添加数据列表
        lstBytes=Utility.bufferPush(lstBytes,...this.lstUpData);
        lstBytes=Utility.bufferPush(lstBytes,...this.lstCvtIdx);
        lstBytes=Utility.bufferPush(lstBytes,...this.lstCopyIdx);

        // 确保字节数组长度是 4 的倍数
        while (lstBytes.length % 4 !== 0) {
            lstBytes=Utility.bufferPush(lstBytes,0);
        }

        return Buffer.from(lstBytes);
    }

    // 比较方法
    equals(other) {
        if (!(other instanceof MT_UpTmplt)) return false;
        try {
            const bytesObj = other.toBytes();
            const bytesThis = this.toBytes();

            if (bytesObj.length !== bytesThis.length) return false;

            return Buffer.compare(bytesObj, bytesThis) === 0;
        } catch {
            return false;
        }
    }
}

module.exports = MT_UpTmplt;
