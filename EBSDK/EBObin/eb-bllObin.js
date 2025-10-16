const fs = require('fs');
const path = require('path');
const Utility = require('./eb-utility');
const JS_OtaAppPara = require('./eb-pre-otaAppPara');
const JS_ObinOption = require('./eb-pre-obinOption');
const {DTU_OtaFile, JS_Obin} = require('./eb-lang-obin');

class MT_BllObin {
    constructor(binBuffer, otaConfig) {
        this.binBuffer = binBuffer;
        this.otaConfig = otaConfig;
        this.isBattery = otaConfig.AppPara.Battery;
    }

    buildObin() {
        if (!this.otaConfig) {
            throw new Error("MT_BllObin[constructor(binBuffer, otaConfig)]  => Missing otaConfig") 
        }
      
        let otaConfigString = JSON.stringify(this.otaConfig);
        const ota = new DTU_OtaFile(this.binBuffer, new JS_ObinOption().GetUpgradeOption(otaConfigString), new JS_OtaAppPara().GetAppPara(otaConfigString), this.isBattery);
        const obin = new JS_Obin(ota);
        return obin.saveObin()
    }

}

// let mtBllObin = new MT_BllObin('output.bin');
// mtBllObin.buildObin('output.bin');
module.exports = {
    MT_BllObin
}