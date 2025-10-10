const Utility =require('./eb-utility')
const MT_Period = require("./eb-lang-period");
class ConstData {
    constructor(data={}) {
        this.Data = data.Data ?? Buffer.alloc(0);
        this.Idx = data.Idx ?? 0;
    }
    static fromJSON(json){
        return new ConstData(json)
    }
}

class MT_ConstTable {
    constructor(data={}) {
        this.lstConst = data.lstConst ?? [].map(val=>new ConstData());
    }
    static fromJSON(json){
        return new MT_ConstTable(json)
    }

    /**
     * 比较两个字节数组是否相等
     * @param {Buffer|Uint8Array} data1 第一个字节数组
     * @param {Buffer|Uint8Array} data2 第二个字节数组
     * @returns {boolean} 是否相等
     */
    IsArrayEqual(data1, data2) {
        // 转换为 Buffer
        data1 = data1 instanceof Buffer ? data1 : Buffer.from(data1);
        data2 = data2 instanceof Buffer ? data2 : Buffer.from(data2);

        // 检查输入有效性
        if (!data1 || !data2 || data1.length !== data2.length) return false;

        // 逐字节比较
        return data1.every((byte, index) => byte === data2[index]);
    }

    /**
     * 获取常量表长度
     * @returns {number} 表长度
     */
    GetConstTableLength() {
        if (!this.lstConst || this.lstConst.length < 1) return -1;

        // 找出最大索引+数据长度的常量
        const MaxIdx = this.lstConst.reduce((max, current) =>
            current.Idx + current.Data.length > max.Idx + max.Data.length ? current : max
        );

        // 计算长度并对齐到4的倍数
        let Len = MaxIdx.Idx + MaxIdx.Data.length;
        if (Len % 4 > 0) {
            Len += 4 - (Len % 4);
        }

        return Len;
    }

    /**
     * 转换为字节数组
     * @returns {Buffer} 字节数组
     */
    ToBytes() {
        const TableLen = this.GetConstTableLength();
        if (TableLen < 0) return null;

        // 创建初始化为0的缓冲区
        const lstBytes = Buffer.alloc(TableLen, 0);

        // 填充数据
        for (const constData of this.lstConst) {
            constData.Data.copy(lstBytes, constData.Idx);
        }

        return lstBytes;
    }

    /**
     * 插入常量
     * @param {Buffer|Uint8Array} data 要插入的数据
     * @returns {number} 插入的索引
     * //插入位置必须满足两个条件：1、起始索引是len的整数倍；2、剩余长度大于len
     */
    InsertConst(data) {
        if (!data || data.length < 1)  return -1

        if (this.lstConst.length === 0) {
            this.lstConst.push(new ConstData({Data:data, Idx:0}));
            return 0;
        }

        let i = 0;
        let lstIdxUsed = Buffer.alloc(0);

        for (let j = 0; j < this.lstConst.length; j++) {
            if (this.IsArrayEqual(this.lstConst[j].Data, data)) {
                return this.lstConst[j].Idx;
            } else {
                for (i = 0; i < this.lstConst[j].Data.length; i++) {
                    lstIdxUsed=Utility.bufferPush(lstIdxUsed,this.lstConst[j].Idx + i);
                }
            }
        }

        let Idx = -1;

        Utility.QuickSort(lstIdxUsed, 0, lstIdxUsed.length - 1);

        for (i = 0; i < lstIdxUsed.length - 1; i++) {
            if ((lstIdxUsed[i + 1] - lstIdxUsed[i] > data.length) &&
                ((lstIdxUsed[i] + 1) % data.length === 0)) {
                Idx = lstIdxUsed[i] + 1;
                break;
            }
        }

        if (i === lstIdxUsed.length - 1) {
            Idx = lstIdxUsed[lstIdxUsed.length - 1] + 1;
            while (Idx % data.length !== 0) {
                Idx++;
            }
        }

        this.lstConst.push(new ConstData({Data:data, Idx:Idx}));
        return Idx;
    }
}
/*
function testConstTable() {
    const constTable = new MT_ConstTable();

    // 插入常量

    idx1=constTable.InsertConst(Buffer.from([0,1, 2, 3]));
    idx2=constTable.InsertConst(Buffer.from([1, 5, 6,0]));
    idx3=constTable.InsertConst(Buffer.from([2,3]));
    idx4=constTable.InsertConst(Buffer.from([7]));
    idx5=constTable.InsertConst(Buffer.from([1,3]));
    idx6=constTable.InsertConst(Buffer.from([0,1,5,6]));


    console.log('Inserted indices:', idx1, idx2,idx3);

    // 转换为字节数组
    const bytesArray = constTable.ToBytes();
    console.log('Bytes array:', bytesArray);
}
testConstTable()
 */
module.exports = {
    ConstData,
    MT_ConstTable
};
