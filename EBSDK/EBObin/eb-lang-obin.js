const fs = require('fs');
const path = require('path');
const MT_BllFuotaPackets = require('./eb-lang-bllFuotaPackets');
const JS_OtaAppPara = require('./eb-pre-otaAppPara');
const JS_ObinOption = require('./eb-pre-obinOption');

class JS_Obin {
    constructor(ota) {
        this.otaFile = ota;
    }

    saveObin(lstBytes = []) {
        this.otaFile.buildFuotaPackets(lstBytes);
        delete this.otaFile.binFile;
        delete this.otaFile.obinUse;
        delete this.otaFile.upgradeAddr;
        delete this.otaFile.fragSize;
        delete this.otaFile.lstRunPara;
        const jsonString = JSON.stringify(this);
        return jsonString
    }
   
}

class FuotaUpgrade_Range {
    constructor(deveui_start, deveui_end) {
        this.deveui_start = deveui_start;
        this.deveui_end = deveui_end;
    }
}

const ObinUsage = {
    UpgradeBllPara: 0,
    UpgradeFirmware: 1,
    FactoryTest: 2
};

class DTU_OtaFile {
    constructor(binBuffer, opt = {}, para = {}, isClassA) {
        this.binBuffer = binBuffer;
        this.obinUse = ObinUsage.UpgradeBllPara;
        this.upgradeAddr = 0;
        this.fragSize = 0;
        this.lstRunPara = [];
        this.bin_dic = {};
        this.devEUI = [];
        this.otaMode = null;
        this.otaPort = 0;
        this.packets = 0;
        this.intervalTime = 0;
        this.txCounts = 0;
        this.swtime = 0;
        this.src = null;
        this.deviceIntervalTime = null;
        this.dndata = null;
        this.appeui = null;
        this.isClassA = isClassA

        if (opt.Addr !== '0x02') {
            this.obinUse = ObinUsage.UpgradeFirmware;
        }
        this.updatePara(opt, para);
        this.buildFuotaPackets();
    }

    updatePara(opt, para, ) {
        this.lstRunPara = para.GetFuotaBytes();
        this.upgradeAddr = parseInt(opt.Addr, 16);
        this.devEUI = opt.devEUI;
        this.appeui = opt.AppEui;
        this.otaPort = 201;
        this.txCounts = 2;
        this.otaMode = opt.UpgrdType;
        this.AppPara = para;
        if (opt.UpgrdType === 'sp') {
            this.fragSize = 100;
            this.intervalTime = 500;
            this.devEUI = [new FuotaUpgrade_Range('0000000000000000', '0000000000000000')];
        } else {
            if (this.isClassA) {
                this.intervalTime=500
            } else {
                this.intervalTime = 6000;
            }
            if (opt.UpgrdType === 'sw') {
                this.swtime = 2000;
                this.fragSize = 200;
                this.deviceIntervalTime = '5000';
            } else if (opt.UpgrdType === 'gw') {
                this.fragSize = 100;
                this.deviceIntervalTime = '32000';
            }
        }
    }

    buildFuotaPackets(lstBytes = []) {
        let lstFuotaPackets = null;
        if (this.obinUse === ObinUsage.UpgradeFirmware) {
            lstFuotaPackets = new MT_BllFuotaPackets(this.binBuffer, this.fragSize).getFirmwareFuotaPacktes(this.upgradeAddr, this.lstRunPara);
        } else {
            lstFuotaPackets = new MT_BllFuotaPackets(this.binBuffer, this.fragSize).getBllFuotaPackets(this.lstRunPara, lstBytes);
        }
        if (!lstFuotaPackets || lstFuotaPackets.length < 2) {
            console.log('build obin file failed!');
            return;
        }
        this.packets = lstFuotaPackets.length - 1;
        let i = 0;
        this.bin_dic = {};
        lstFuotaPackets.forEach(lst => {
            const otaBin = new DTU_OtaBin(i, lst);
            this.bin_dic[i] = otaBin;
            i++;
        });
    }
}

class DTU_OtaBin {
    constructor(idx, data) {
        this.index = idx;
        this.buffer = Buffer.from(data).toString('base64');
        this.bufferstring = data.map(byte => {
            // 将每个元素转换为2位的16进制字符串，不足2位的前面补0
            return byte.toString(16).toUpperCase().padStart(2, '0');
        }).join(' ');
    }
}

module.exports = {
    JS_Obin,
    DTU_OtaFile,
    DTU_OtaBin,
    FuotaUpgrade_Range,
}