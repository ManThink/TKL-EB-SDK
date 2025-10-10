const fs = require('fs');
const path = require('path');
const Utility = require('./eb-utility');
const JS_OtaAppPara = require('./eb-pre-otaAppPara');
const JS_ObinOption = require('./eb-pre-obinOption');
const {DTU_OtaFile, JS_Obin} = require('./eb-lang-obin');

class MT_BllObin {
    constructor(file, isBattery) {
        this.binFile = file;
        this.isBattery = isBattery;
        this.upgrdParaFile = '';
        const dirPath = path.dirname(file)
        const files = fs.readdirSync(dirPath);
        files.forEach(f => {
            if (path.extname(f) === '.ota') {
                this.upgrdParaFile = path.join(dirPath, f);
                console.log( this.upgrdParaFile)
            }
        });
    }

    buildObin(file) {
        if (!fs.existsSync(this.upgrdParaFile)) {
            console.log("file is not existed: " + this.upgrdParaFile);
            return;
        }
        const paraStr = Utility.ReadTxtFile(this.upgrdParaFile);
        if (paraStr === '') {
            console.log("build obin file failed!");
            return;
        }
        const ota = new DTU_OtaFile(file, new JS_ObinOption().GetUpgradeOption(paraStr), new JS_OtaAppPara().GetAppPara(paraStr), this.isBattery);
        const obin = new JS_Obin(ota);
        const savedPath = path.join(path.dirname(file), `${path.basename(file, '.bin')}.obin`);
        if (obin.saveObin(file)) {
            console.log("build obin file success: " + savedPath);
        } else {
            console.log("build obin file failed!");
        }
    }

    buildObinWithBytes(file, lstBytes) {
        this.upgrdParaFile = '';
        const files = fs.readdirSync(path.dirname(file));
        files.forEach(f => {
            if (path.extname(f) === '.ota') {
                this.upgrdParaFile = f;
                return;
            }
        });
        if (this.upgrdParaFile === '') {
            console.log("file is not existed: " + this.upgrdParaFile);
            return;
        }
        const paraStr = Utility.ReadTxtFile(this.upgrdParaFile);
        if (paraStr === '') {
            console.log("build obin file failed!");
            return;
        }
        const ota = new DTU_OtaFile(file, new JS_ObinOption().GetUpgradeOption(paraStr), new JS_OtaAppPara().GetAppPara(paraStr), this.isBattery);
        const obin = new JS_Obin(ota);
        const savedPath = path.join(path.dirname(file), `${path.basename(file, '.bin')}.obin`);
        if (obin.saveObin(file, lstBytes)) {
            console.log("build obin file " + file + " success!");
        } else {
            console.log("build obin file " + file + " failed!");
        }
    }

    /*buildObin() {
        this.buildObin(this.binFile);
    }*/

    buildAllObin() {
        const files = fs.readdirSync(path.dirname(this.binFile));
        files.forEach(f => {
            if (path.extname(f) === '.bin') {
                this.buildObin(f);
            }
        });
    }
}

// let mtBllObin = new MT_BllObin('output.bin');
// mtBllObin.buildObin('output.bin');
module.exports = {
    MT_BllObin
}