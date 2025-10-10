class JS_OtaAppPara {
    constructor(para = {}) {
        this.FuotaVersion = para.FuotaVersion ?? 0;
        this.HwType = para.HwType ?? 0;
        this.HwVersion = para.HwVersion ?? 0;
        this.SwVersion = para.SwVersion ?? 0;
        this.BzType = para.BzType ?? 0;
        this.BzVersion = para.BzVersion ?? 0;
        this.FilterMask = para.FilterMask ?? 0;
        this.OtaMask = para.OtaMask ?? 0;
        this.WakeupIn = para.WakeupIn ?? false;
        this.WakeupOut = para.WakeupOut ?? false;
        this.BackHaul = para.BackHaul ?? "bh_lorawan";
        this.BaudRate = para.BaudRate ?? 0;
        this.StopBits = para.StopBits ?? 0;
        this.DataBits = para.DataBits ?? 0;
        this.Checkbit = para.Checkbit ?? "none";
        this.TransparentBit = para.TransparentBit ?? false;
        this.KeepRx = para.KeepRx ?? false;
        this.Battery = para.Battery ?? false;
        this.Uart1Used = para.Uart1Used ?? false;
        this.SwUp = para.SwUp ?? false;
        this.JoinRst = para.JoinRst ?? true;
        this.PowerCtrl = para.PowerCtrl ?? false;
        this.Wait60s = para.Wait60s ?? false;
        this.ConfirmDuty = para.ConfirmDuty ?? 0;
        this.portPara = para.portPara ?? 71;
        this.portTransparent = para.portTransparent ?? 51;
        this.RstHours = para.RstHours ?? 720;
        this.TimeOffset = para.TimeOffset ?? 0;
    }

    GetAppPara(jason) {
        if (jason == null || jason == "") return null;
        try {
            const jsonObj = JSON.parse(jason);
            const Token = jsonObj?.AppPara;
            if (Token == null) return null;
            const AppPara = new JS_OtaAppPara(Token);
            return AppPara;
        } catch (ex) {
            return null;
        }
    }

    GetOtaBytes() {
        const lstBytes = [];
        lstBytes.push((this.FuotaVersion + ((this.HwType & 0xF) << 4)));
        lstBytes.push((this.HwType >> 4));
        lstBytes.push((3 + (this.HwVersion << 4)));
        lstBytes.push(this.SwVersion);
        lstBytes.push((this.BzType & 0xFF));
        lstBytes.push((this.BzType >> 8));
        lstBytes.push(this.BzVersion);
        lstBytes.push((this.FilterMask + (this.OtaMask << 4)));
        return lstBytes;
    }

    GetFuotaBytes() {
        const lstBytes = this.GetOtaBytes();
        const lstRunParaBytes = this.GetRunParaBytes();
        lstRunParaBytes.splice(0, 2);
        lstBytes.push(...lstRunParaBytes);
        return lstBytes;
    }

    GetRunParaBytes() {
        const lstBytes = [];
        lstBytes.push(0);
        let backhaul = 0;
        if (this.BackHaul == "bh_lorawan") backhaul = 0;
        else if (this.BackHaul == "bh_4g") backhaul = 1;
        lstBytes.push((this.WakeupIn ? 1 : 0) + ((this.WakeupOut ? 1 : 0) << 1) + (backhaul << 4));
        lstBytes.push(this.BaudRate / 1200);
        let check = 0;
        if (this.Checkbit == "odd") check = 1;
        else if (this.Checkbit == "even") {
            this.DataBits = 9;
            check = 2;
        }
        lstBytes.push((this.DataBits + (this.StopBits << 4) + (check << 6)));
        lstBytes.push((this.KeepRx ? 1 : 0) + ((this.Battery ? 1 : 0) << 1) + ((this.Uart1Used ? 1 : 0) << 2) + ((this.TransparentBit ? 1 : 0) << 3) + ((this.SwUp ? 1 : 0) << 4)
            + ((this.JoinRst ? 1 : 0) << 5) + ((this.PowerCtrl ? 1 : 0) << 6) + ((this.Wait60s ? 1 : 0) << 7));
        lstBytes.push(this.ConfirmDuty);
        lstBytes.push(this.portPara);
        lstBytes.push(this.portTransparent);
        lstBytes.push((this.RstHours & 0xFF));
        lstBytes.push((this.RstHours >> 8));
        lstBytes.push(...Buffer.from([this.TimeOffset & 0xFF, (this.TimeOffset >> 8) & 0xFF, (this.TimeOffset >> 16) & 0xFF, (this.TimeOffset >> 24) & 0xFF]));
        return lstBytes;
    }
}

module.exports = JS_OtaAppPara;