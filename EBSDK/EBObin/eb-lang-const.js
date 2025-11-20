
class JS_ConstString {
    static ActionList = ["none", "up", "upr", "rmsrc", "rmdes", "rst"];
    static DataTypeList = ["uint", "int", "float", "bcd", "double", "asc", "xaf", "xaasc"];
    static CvtBuffer = ["ack", "resv1", "table", "temp", "fw", "rd", "cf", "app", "ds", "quhdr", "uphdr", "cond", "appsts", "sensor", "resv2", "resv3"];
    static OpStr = ["*", "/", "+", "-", "&", "|", "@", "!", "<<", ">>", "s", "!=", "==", "<", ">", "in", "out", "dic", "%", "^", "!^", "=", "|_|"];
    static Unit = ["s", "m", "h", "d"];
    static CrcMode = ["crc16", "ccitt16", "sum"];
    static CvtCond = ["none", "ontime", "timeout", "pre"];
    static UpType = ["normal", "1", "2"];
    static UpCond = ["none", "1", "2"];
    static QueryCond = ["none", "1", "2"];
    static IFList = ["uart1", "uart2", "spi", "i2c", "gpio", "ad", "no_query"];
    static OvenList = ["none", "odd", "even"];

    // 私有静态方法
    static #getIdx(src, str) {
        str = str.replace(/\s/g, '').trim();

        // 查找字符串
        const index = src.indexOf(str);
        if (index !== -1) return index;

        // 尝试解析数字
        const numIndex = parseInt(str);
        if (!isNaN(numIndex)) return numIndex;

        return -1;
    }

    // 静态方法们
    static GetActionIdx(action) {
        return this.#getIdx(this.ActionList, action);
    }

    static GetDataTypeIdx(type) {
        return this.#getIdx(this.DataTypeList, type);
    }

    static GetActionStr(idx) {
        return (idx >= 0 && idx < this.ActionList.length) ? this.ActionList[idx] : "";
    }

    static GetDataTypeStr(idx) {
        return (idx >= 0 && idx < this.DataTypeList.length) ? this.DataTypeList[idx] : "";
    }

    static GetCvtBufIdx(buf) {
        if (buf === "qu") buf = "quhdr";
        else if (buf === "up") buf = "uphdr";
        return this.#getIdx(this.CvtBuffer, buf);
    }

    static GetCvtBufStr(idx) {
        return (idx >= 0 && idx < this.CvtBuffer.length) ? this.CvtBuffer[idx] : "";
    }

    static GetUnitIdx(unit) {
        return this.#getIdx(this.Unit, unit);
    }

    static GetCrcModeIdx(crc) {
        return this.#getIdx(this.CrcMode, crc);
    }

    static GetCvtCondIdx(cond) {
        return this.#getIdx(this.CvtCond, cond);
    }

    static GetUpTypeIdx(type) {
        return this.#getIdx(this.UpType, type);
    }

    static GetUpCondIdx(cond) {
        return this.#getIdx(this.UpCond, cond);
    }

    static GetIFIdx(inf) {
        return this.#getIdx(this.IFList, inf);
    }

    static GetQueryCond(cond) {
        return this.#getIdx(this.QueryCond, cond);
    }

    static GetOpIdx(inputstr) {
        return this.OpStr.indexOf(inputstr);
    }

    static GetOvenBit(oven) {
        return this.#getIdx(this.OvenList, oven);
    }
}
// 导出类
module.exports = JS_ConstString;