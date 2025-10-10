const fs = require('fs');
const crypto = require('crypto');
const JS_ConstString = require("./eb-lang-const");

class Utility {
    /**
     * 对象转换为字节数组（模拟 C# 的 StructureToByte）
     * @param {Object} structure 需要转换的对象
     * @returns {Buffer} 转换后的字节数组
     */
    static StructureToByte(structure) {
        try {
            // 使用 Buffer.from 将对象转换为 Buffer
            return Buffer.from(JSON.stringify(structure));
        } catch (error) {
            console.error('structureToByte error:', error);
            return null;
        }
    }

    /**
     * 比较两个对象是否相等
     * @param {Object} obj1 对象1
     * @param {Object} obj2 对象2
     * @returns {boolean} 是否相等
     */
    static IsEqual(obj1, obj2) {
        if (obj1 === null || obj2 === null) return false;

        const bytesObj1 = this.structureToByte(obj1);
        const bytesObj2 = this.structureToByte(obj2);

        if (!bytesObj1 || !bytesObj2) return false;
        if (bytesObj1.length !== bytesObj2.length) return false;

        return bytesObj1.every((byte, index) => byte === bytesObj2[index]);
    }
    /**
     * 快速排序
     *     /// <param name="lstData">需要排序的数据集合</param>
     *     /// <param name="begin">起始索引</param>
     *     /// <param name="end">结束索引</param>
     */
    static QuickSort(lstData, begin, end) {
        //如果区间只有一个数，则返回
        if (end>=begin) return
        const temp = lstData[begin]; //将区间的第一个数作为基准数
        let i = begin; //从左到右进行查找时的“指针”，指示当前左位置
        let j = end; //从右到左进行查找时的“指针”，指示当前右位置
        //不重复遍历
        while (i < j) {
            //当右边的数大于基准数时，略过，继续向左查找
            //不满足条件时跳出循环，此时的j对应的元素是小于基准元素的
            while (i < j && lstData[j] > temp) j--;
            lstData[i] = lstData[j]; //将右边小于等于基准元素的数填入右边相应位置
            //当左边的数小于等于基准数时，略过，继续向右查找
            //(重复的基准元素集合到左区间)
            //不满足条件时跳出循环，此时的i对应的元素是大于等于基准元素的
            while (i < j && lstData[i] <= temp) i++;
            //将左边大于基准元素的数填入左边相应位置
            lstData[j] = lstData[i];
        }
        //将基准元素填入相应位置
        lstData[i] = temp;
        //此时的i即为基准元素的位置
        //对基准元素的左边子区间进行相似的快速排序
        this.quickSort(lstData, begin, i - 1);
        //对基准元素的右边子区间进行相似的快速排序
        this.quickSort(lstData, i + 1, end);
    }

    /**
     * CRC16计算
     * @param {Buffer} buf 数据缓冲区
     * @param {number} start 起始位置
     * @param {number} length 长度
     * @param {number} poly 多项式
     * @returns {number} CRC16校验值
     */
    static Crc16(buf, start, length, poly) {
        let crc = 0xFFFF;

        for (let i = start; i < start + length; i++) {
            crc ^= buf[i];
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x01) !== 0) {
                    crc = ((crc >> 1) ^ poly);
                } else {
                    crc >>= 1;
                }
            }
        }

        return crc;
    }

    /**
     * 字节数组求和
     * @param {Buffer} data 数据缓冲区
     * @param {number} idx 起始索引
     * @param {number} len 长度
     * @param {number} exsum 初始和
     * @returns {number} 求和结果
     */
    static Sum(data, idx, len, exsum = 0) {
        if (!data) return 0;
        for (let i = idx; i < idx + len; i++) {
            exsum += data[i];
        }
        exsum = exsum & 0xFFFF;
        return exsum;
    }

    /**
     * 读取文本文件
     * @param {string} file 文件路径
     * @returns {string} 文件内容
     */
    static ReadTxtFile(file) {
        try {
            return fs.readFileSync(file, 'utf8');
        } catch (error) {
            console.error('readTxtFile error:', error);
            return '';
        }
    }

    /**
     * 字符串转字节数组
     * @param {string} input 输入字符串
     * @returns {Buffer} 字节数组
     */
    static StringToArry(input) {
        if (!input) return Buffer.from([]);

        let txString = input.replace(/\s+/g, '').replace(/0x/gi, '');

        txString.padStart(2, '0');
        try {
            return Buffer.from(txString, 'hex');
        } catch (error) {
            console.error('stringToArry error:', error);
            return null;
        }
    }

    /**
     * 字节数组转字符串
     * @param {Buffer} data 数据缓冲区
     * @returns {string} 转换后的字符串
     */
    static ArryToString(data) {
        if (!data) return '';

        return data.map(byte => byte.toString(16).padStart(2, '0')).join(' ');
    }

    /**
     * 导入 JSON 参数
     * @param {string} path 文件路径
     * @returns {Object} 解析后的对象
     */
    static ImportPara(path) {
        try {
            const content = fs.readFileSync(path, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('importPara error:', error);
            return null;
        }
    }

    /**
     * 导出 JSON 参数
     * @param {Object} obj 需要导出的对象
     * @param {string} path 文件路径
     */
    static ExportPara(obj, path) {
        try {
            const jsonStr = JSON.stringify(obj, null, 2);
            fs.writeFileSync(path, jsonStr);
        } catch (error) {
            console.error('exportPara error:', error);
        }
    }
    static  isNumberStr(str) {
        // 匹配除数字、小数点和负号外的字符
        const regex = /[^\d.-]/;
        return !regex.test(str);
    }
    static bufferPush(originalBuffer, ...args) {
        // 计算总长度
        const additionalLength = args.reduce((total, arg) => {
            if (typeof arg === 'number') return total + 1;
            if (arg instanceof Buffer) return total + arg.length;
            if (Array.isArray(arg)) return total + arg.length;
            throw new TypeError('不支持的输入类型');
        }, 0);

        // 创建新的缓冲区
        const newBuffer = Buffer.alloc(originalBuffer.length + additionalLength);

        // 复制原始缓冲区
        originalBuffer.copy(newBuffer, 0);

        // 追加新内容的偏移量
        let offset = originalBuffer.length;

        // 追加参数
        args.forEach(arg => {
            if (typeof arg === 'number') {
                // 单个数字
                const byte = Math.max(0, Math.min(255, Math.floor(arg)));
                newBuffer.writeUInt8(byte, offset);
                offset += 1;
            } else if (arg instanceof Buffer) {
                // Buffer
                arg.copy(newBuffer, offset);
                offset += arg.length;
            } else if (Array.isArray(arg)) {
                // 数组
                arg.forEach(item => {
                    const byte = Math.max(0, Math.min(255, Math.floor(item)));
                    newBuffer.writeUInt8(byte, offset);
                    offset += 1;
                });
            } else {
                throw new TypeError('不支持的输入类型');
            }
        });
        return newBuffer;
    }
}
module.exports = Utility;
