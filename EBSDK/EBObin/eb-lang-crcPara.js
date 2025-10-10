const Utility=require('./eb-utility')
const JS_ConstString =require('./eb-lang-const')
class MT_CrcFunc {
    /**
     * 构造函数
     * @param {string} mode CRC模式
     * @param {string} poly CRC多项式, crc输入参数检验参数 16进制
     * @param {number} StartIdx // 起始地址 从左往右
     * @param {number} EndIdx // 结束地址 从右往左
     * @param {number} PlaceIdx // CRC校验结果 放的地址
     * @param {number} PlaceInvert // true: placeIdx从右往左数
     * @param {number} PlaceIdx // CRC校验结果 放的地址
     * @param {boolean} LittleEndian // 校验结果大小端  true： 小端([01,02] =>  0x0201)
     * @param {number} CrcLen 
     * @param {number} start 起始索引
     * @param {number} end 结束索引
     * @param {number} len CRC长度
     */

    constructor(data={}) {
        this.Mode = data.Mode ?? "";
        this.Poly = data.Poly ?? 0;
        this.StartIdx =data.StartIdx ?? 0;
        this.EndIdx = data.EndIdx ?? 0;
        this.CrcLen = data.CrcLen ?? 0;
    }
    static fromJSON(json) {
        return new MT_CrcFunc(json);
    }

    /**
     * 比较两个 MT_CrcFunc 对象是否相等
     * @param {MT_CrcFunc} obj 要比较的对象
     * @returns {boolean} 是否相等
     */
    equals(obj) {
        if (!(obj instanceof MT_CrcFunc)) return false;

        return (
            obj.Mode === this.Mode &&
            obj.Poly === this.Poly &&
            obj.StartIdx === this.StartIdx &&
            obj.EndIdx === this.EndIdx &&
            obj.CrcLen === this.CrcLen
        );
    }

    /**
     * 转换为字节数组
     * @returns {Buffer|null} 字节数组
     */
    toBytes() {
        // try {
            let lstBytes = Buffer.alloc(0);

            // Poly 转换
            const polyBuffer = Buffer.alloc(2);
            polyBuffer.writeUInt16LE(this.Poly, 0);
            lstBytes=Utility.bufferPush(lstBytes,...polyBuffer);

            // 第一个复合字节
            const firstByte =
                (this.StartIdx & 0x1F) |
                ((this.EndIdx & 0x7) << 5);
            lstBytes=Utility.bufferPush(lstBytes,firstByte);

            // 获取模式索引
            const bMode = JS_ConstString.GetCrcModeIdx(this.Mode);
            if (bMode < 0) return Buffer.alloc(0);

            // 第二个复合字节
            const secondByte =
                ((this.EndIdx & 0x1F) >> 3) |
                ((bMode & 0xF) << 2) |
                (this.CrcLen << 6);
            lstBytes=Utility.bufferPush(lstBytes,secondByte);
            return lstBytes
        // } catch (error) {
        //     console.error('Error in toBytes:', error);
        //     return null;
        // }
    }
}

class MT_CrcPara {
    constructor(data={}) {
        this.Mode = data.Mode ?? '';
        this.Poly = data.Poly ?? '';
        this.CrcLen = data.CrcLen ?? 0;
        this.StartIdx = data.StartIdx ?? 0;
        this.EndIdx = data.EndIdx ?? 0;
        this.PlaceIdx = data.PlaceIdx ?? 0;
        this.PlaceInvert = data.PlaceInvert ?? false;
        this.LittleEndian = data.LittleEndian  ?? false;
    }
    static fromJSON(json) {
        return new MT_CrcPara(json);
    }

    /**
     * 插入CRC函数
     * @param {MT_BllPara} para BLL参数对象
     * @returns {number} 插入结果
     */
    InsertCrcFunc(para) {
        // 调用 MT_BllPara 的 InsertCrcFunc 方法
        return para.InsertCrcFunc(this);
    }
}
// 导出类
module.exports = {
    MT_CrcFunc,
    MT_CrcPara
};
