class MT_KVTable {
    constructor(key = null, value = null,len = 0 ) {
        this.len = len;
        this.key = key ?? Buffer.alloc(0);
        this.value = value ?? Buffer.alloc(0);
    }
}

module.exports = MT_KVTable;