const fs = require('fs');
const path = require('path');
//const { FuotaReqEvent, FuotaHandle } = require('./eb-lang-obin');
const Utility = require('./eb-utility');

const FuotaReqEvent = {
    PKG_FTA_Version_REQ: 0,
    PKG_FTA_Status_REQ: 1,
    PKG_FTA_SessionSETUP_REQ: 2,
    PKG_FTA_SessionDELET_REQ: 3,
    PKE_FTA_CSession_REQ: 4,
    PKE_FTA_BSession_REQ: 5,
    PKG_FTA_DataFragment: 8,
    PKG_FTA_Session_Packet_REQ: 80,
    PKG_FTA_Session_Packet_OVER: 81
};

const FuotaHandle = {
    PKG_FTA_HANDLE_LWPARA: 3,
    PKG_FTA_HANDLE_BLLPARA: 4,
    PKG_FTA_HANDLE_FIRMWARE: 32
};

class MT_BllFuotaPackets {
    constructor(binfile, fragsize) {
        this.BLL_MAXSIZE = 2048;
        this.BIN_HEADER = 0x55;
        this.BIN_TAIL = 0xAA;
        this.BLOCK_SIZE = 1024;
        this.CRC_SIZE = 2;
        this.binFile = binfile;
        this.fragSize = fragsize;
        this.fragIndex = 0;
        this.mcGroupBitMask = 0;
        this.fragmentationMatrix = 0;
        this.blockAckDelay = 3;
        this.descriptor = 0;
    }

    checkBin(bin) {
        const len = bin[2] + (bin[3] << 8);
        if (bin === null || len !== bin.length || bin[0] !== this.BIN_HEADER || bin[bin.length - 1] !== this.BIN_TAIL) {
            console.log("wrong format of bin file");
            return false;
        }
        return true;
    }

    checkBlock(block) {
        const crc = Utility.Sum(block, this.CRC_SIZE, this.BLOCK_SIZE - this.CRC_SIZE, 0);
        if ((block[0] + (block[1] << 8)) !== crc) {
            return false;
        }
        return true;
    }

    readBllBin() {
        let lstBytes = [];
        try {
            const data = fs.readFileSync(this.binFile);
            const len = data[4] + (data[5] << 8);
            if (!this.checkBlock(data.slice(0, this.BLOCK_SIZE))) {
                console.log("wrong crc of first block!");
                return null;
            }

            if (len > this.BLOCK_SIZE - this.CRC_SIZE) {
                lstBytes = lstBytes.concat(data.slice(this.CRC_SIZE, this.BLOCK_SIZE));
                if (!this.checkBlock(data.slice(this.BLOCK_SIZE, 2048))) {
                    console.log("wrong crc of second block!");
                    return null;
                }
                lstBytes = lstBytes.concat(data.slice(this.BLOCK_SIZE + this.CRC_SIZE, len + this.CRC_SIZE));
            } else {
                lstBytes = lstBytes.concat(data.slice(this.CRC_SIZE, len + this.CRC_SIZE));
            }

            if (!this.checkBin(lstBytes[0])) {//转为buffer
                console.log("wrong format of bin file");
                return null;
            }
        } catch (ex) {
            console.log("reading bin file failed: " + ex.toString());
            return null;
        }
        return lstBytes[0];
    }

    readFirmwareBin() {
        let lstBytes = [];
        try {
            const data = fs.readFileSync(this.binFile);
            lstBytes = lstBytes.concat(data);
        } catch (ex) {
            console.log("reading bin file failed: " + ex.toString());
            return null;
        }
        return lstBytes;
    }

    getFuotaBytes(addr, runpara, lstBin) {
        let lstBytes = [];
        lstBytes.push((addr & 0xff));
        lstBytes.push(((addr >> 8) & 0xff));
        lstBytes.push(((addr >> 16) & 0xff));
        lstBytes.push(((addr >> 24) & 0xff));
        if (runpara !== null) lstBytes = lstBytes.concat(runpara);
        if (lstBin !== null) lstBytes = lstBytes.concat(...lstBin);
        const crc = Utility.Sum(lstBytes, 0, lstBytes.length, 0);
        lstBytes.push((crc & 0xff));
        lstBytes.push(((crc >> 8) & 0xff));
        return lstBytes;
    }

    getLWParaFuotaBytes(addr, lstLW) {
        return this.getFuotaBytes(addr, null, lstLW);
    }

    getFirmwareFuotaBytes(addr, runpara) {
        return this.getFuotaBytes(addr, runpara, this.readFirmwareBin());
    }

    getBllFuotaBytes(runpara) {
        return this.getFuotaBytes(2, runpara, this.readBllBin());
    }

    getFuotaSetupBytes(handle, fuotasize) {
        const packets = Math.floor(fuotasize / this.fragSize) + ((fuotasize % this.fragSize) > 0 ? 1 : 0);
        const padding = this.fragSize * packets - fuotasize;
        let lstBytes = [];
        lstBytes.push(FuotaReqEvent.PKG_FTA_SessionSETUP_REQ);
        lstBytes.push(((this.fragIndex & 3) << 4) + (this.mcGroupBitMask & 0xF));
        lstBytes.push(packets & 0xFF);
        lstBytes.push(packets >> 8);
        lstBytes.push(this.fragSize);
        lstBytes.push(((this.blockAckDelay & 0x7) + ((this.fragmentationMatrix & 0x7) << 3)));
        lstBytes.push(padding);
        lstBytes.push(handle);
        lstBytes.push(this.descriptor & 0xff);
        lstBytes.push(((this.descriptor) >> 8) & 0xff);
        lstBytes.push(((this.descriptor) >> 16) & 0xff);
        return lstBytes;
    }

    paddingFuotaBytes(data) {
        const len = data.length;
        const packets = Math.floor(len / this.fragSize) + ((len % this.fragSize) > 0 ? 1 : 0);
        const padding = this.fragSize * packets - len;
        for (let i = 0; i < padding; i++) {
            data.push(0xFF);
        }
    }

    getFuotaPackets(handle, lstFuotaBytes) {
        if (lstFuotaBytes === null || lstFuotaBytes.length < 1) return null;
        let lstFuotaPackets = [];
        lstFuotaPackets.push(this.getFuotaSetupBytes(handle, lstFuotaBytes.length));
        this.paddingFuotaBytes(lstFuotaBytes);
        for (let i = 0; i < Math.floor(lstFuotaBytes.length / this.fragSize); i++) {
            let lstData = [];
            lstData.push(FuotaReqEvent.PKG_FTA_DataFragment);
            lstData.push(i & 0xFF);
            lstData.push(i >> 8);
            lstData = lstData.concat(lstFuotaBytes.slice(i * this.fragSize, (i + 1) * this.fragSize));
            lstFuotaPackets.push(lstData);
        }
        return lstFuotaPackets;
    }

    getLWParaFuotaPackets(addr, lstLW) {
        return this.getFuotaPackets(FuotaHandle.PKG_FTA_HANDLE_LWPARA, this.getLWParaFuotaBytes(addr, lstLW));
    }

    getBllFuotaPackets(runpara, lstBinBytes) {
        return this.getFuotaPackets(FuotaHandle.PKG_FTA_HANDLE_BLLPARA, this.getFuotaBytes(2, runpara, lstBinBytes));
    }

    getBllFuotaPackets(runpara) {
        return this.getFuotaPackets(FuotaHandle.PKG_FTA_HANDLE_BLLPARA, this.getBllFuotaBytes(runpara));
    }

    getFirmwareFuotaPacktes(addr, runpara) {
        return this.getFuotaPackets(FuotaHandle.PKG_FTA_HANDLE_FIRMWARE, this.getFirmwareFuotaBytes(addr, runpara));
    }
}

module.exports = MT_BllFuotaPackets;