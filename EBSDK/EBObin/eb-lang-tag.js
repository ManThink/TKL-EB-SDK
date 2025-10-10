const Utility=require('./eb-utility')
class MT_Tag {
    constructor(data = {}) {
        this.invert = data.invert ?? false;
        this.index = data.index ?? 0;
        this.tag = data.tag ?? '';
    }
    static fromJSON(json){
        return new MT_Tag(json)
    }

    // 等效于 Equals 方法
    equals(para) {
        // 处理 null/undefined
        if (!para || !this) return false;
        if(!(para instanceof MT_Tag)) return false
        // 使用深度比较
        const thisBytes = this.toBytes();
        const otherBytes = para.toBytes();

        // 长度和内容比较
        if (!otherBytes || !otherBytes || thisBytes.length !== otherBytes.length) return false

        return thisBytes.every((byte, index) =>
            byte === otherBytes[index]
        );
    }

    // 转换为字节数组
    toBytes() {
        try {
            let lstBytes = Buffer.alloc(0);

            // 处理 invert 标志
            const indexByte = this.invert
                ? 0x80 | (this.index & 0x7F)
                : (this.index & 0x7F);

            lstBytes=Utility.bufferPush(lstBytes,indexByte);

            // 从 16 进制字符串转换
            const tagByte = parseInt(this.tag, 16);
            lstBytes=Utility.bufferPush(lstBytes,tagByte);

            return lstBytes;
        } catch (error) {
            console.error('转换字节数组失败', error);
            return null;
        }
    }
}
module.exports = MT_Tag

