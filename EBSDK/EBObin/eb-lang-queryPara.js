const JS_ConstString=require('./eb-lang-const')
const MT_Period =require('./eb-lang-period')
const Utility=require('./eb-utility')
class MT_QueryPara {
    constructor(data={}) {
        this.QueryPeriod = data.QueryPeriod ?? new MT_Period();
        this.QueryTmpltIdx = data.QueryTmpltIdx ?? 0;
        this.MulDev_GroupOver = data.MulDev_GroupOver ?? false;
        this.UpAfterQuery = data.UpAfterQuery ?? false;
        this.UpAfterQueryEventIdx = data.UpAfterQueryEventIdx ?? 0;
        this.Resv = data.Resv ?? 0;
    }
    // 转换为字节数组
    toBytes() {
        let lstBytes = Buffer.alloc(0);

        // 获取单位索引
        const unitIdx = JS_ConstString.GetUnitIdx(this.QueryPeriod.unit);
        if (unitIdx < 0) {
            throw new Error('Invalid unit index');
        }

        // 计算 Period
        const period = (
            (this.QueryPeriod.periodValue & 0x3FFF) |
            (unitIdx << 14)
        );

        // 添加 Period 字节（小端序）
        const periodBuffer = Buffer.alloc(2);
        periodBuffer.writeUInt16LE(period, 0);
        lstBytes=Utility.bufferPush(lstBytes,...periodBuffer);

        // 添加 QueryTmpltIdx 和 MulDev_GroupOver
        lstBytes=Utility.bufferPush(lstBytes,
            (this.QueryTmpltIdx & 0x3F) |
            (this.MulDev_GroupOver ? 0x80 : 0)
        );

        lstBytes = Utility.bufferPush(lstBytes, 
            ( this.UpAfterQuery ? 0x01 : 0x00 ) |
            ( this.UpAfterQueryEventIdx << 1 & 0x3E) |
            ( this.Resv << 6 & 0xC0)
        )

        // 添加 Resv
        // lstBytes=Utility.bufferPush(lstBytes,this.Resv);

        return Buffer.from(lstBytes);
    }

    // 比较方法
    equals(obj) {
        if (!(obj instanceof MT_QueryPara)) return false;

        const bytesObj = obj.toBytes();
        const bytesThis = this.toBytes();

        // 长度不同直接返回 false
        if (bytesObj.length !== bytesThis.length) return false;

        // 逐字节比较
        return Buffer.compare(bytesObj, bytesThis) === 0;
    }
}

module.exports = MT_QueryPara;
