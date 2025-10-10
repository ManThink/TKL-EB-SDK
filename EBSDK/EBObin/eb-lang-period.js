class MT_Period {
    constructor(data={}) {
        this.periodValue = data.periodValue ?? 0;
        this.unit = data.unit ?? 's';
    }
    static fromJSON(json){
        return new MT_Period(json)
    }
}

module.exports = MT_Period;