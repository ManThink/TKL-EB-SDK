class JS_ObinOption {
    constructor(para = {}) {
        this.UpgrdType = para.UpgrdType ?? "";
        this.AppEui = para.AppEui ?? "";
        this.Addr = para.Addr ?? "";
        this.devEUI = para.devEUI ??[];
    }

    GetUpgradeOption(jason) {
        if (jason == null || jason == "") return null;
        try {
            const jsonObj = JSON.parse(jason);
            const Token = jsonObj?.UpgradeOption;
            if (Token == null) return null;
            let UpgradeOption = new JS_ObinOption(Token);
            return UpgradeOption;
        } catch (ex) {
            return null;
        }
    }
}

module.exports = JS_ObinOption;