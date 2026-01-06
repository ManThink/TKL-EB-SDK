const MT_Period  = require('./eb-lang-period');
const MT_QueryPara  = require('./eb-lang-queryPara');
const { MT_CrcPara,MT_CrcFunc} = require('./eb-lang-crcPara');
const MT_Tag = require('./eb-lang-tag');
const JS_CvtRule = require('./eb-pre-cvtRule');
const JS_CopyRule = require('./eb-pre-copyRule');
const MT_CvtRule = require('./eb-lang-cvtRule');
const MT_quEvent =require('./eb-pre-quEvent')
const MT_upEvent =require('./eb-pre-upEvent')
const MT_bllPara =require('./eb-lang-bllPara')
const fs = require('fs');
const Utility = require('./eb-utility');

const testlang={

    "binopt": {

        "queryEventlist": [

            {

                "name": "Qu_IU",

                "cmdBuffer": "01 03 00 06 00 2F 64 0B",

                "ackBuffer": "01 03 5E 43 5D 19 9A 43 5E 33 33 43 5F 4C CD 00 00 00 00 00 00 00 00 00 00 00 00 3F 8C CC CD 40 0C CC CD 40 53 33 33 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 41 31 99 9A 41 B1 99 9A 42 05 33 33 42 31 F6 1A",

                "queryPeriod": {

                    "periodValue": 300,

                    "unit": "s"

                },

                "ackCrcPara": {

                    "Mode": "crc16", 

                    "Poly": "a001", //crc输入参数检验参数

                    "CrcLen": 2, //结果长度

                    "StartIdx": 0, //起始地址 从左往右

                    "EndIdx": 2,  //结束地址 从右往左

                    "PlaceIdx": 1, // CRC校验结果 放的地址

                    "PlaceInvert": true, // true 从右往左

                    "LittleEndian": true // 校验结果大小端

                },

                "caculist": [

                    {

                        "CvtRule": "up[2].3.1.uint=ack.0.1.uint",

                        "CvtCond": "ontime"

                    },

                    {

                        "CvtRule": "up[2].13.2.uint=ack.3.4.float.b,*10",

                        "CvtCond": "ontime",

                        "Repeat": 3

                    },

                    {

                        "CvtRule": "up[2].19.2.uint=ack.27.4.float.b,*10",

                        "CvtCond": "ontime",

                        "Repeat": 3

                    },                

                    {

                        "CvtRule": "up[2].25.4.uint=ack.51.4.float.b,*100",

                        "CvtCond": "ontime"

                    },

                    {

                        "CvtRule": "up[2].29.2.uint=ack.75.4.float.b,*1000",

                        "CvtCond": "ontime"

                    },

                    {

                        "CvtRule": "up[2].9.4.uint=app.28.4.uint.b"

                    },

                    {

                        "CvtRule": "up[2].31.4.uint=ack.83.4.float.b,*10",

                        "CvtCond": "ontime",

                        "Repeat": 4,

                        "ActAfterCvt": "up"

                    }

                ],

                "queryCrcPara": {

                    "Mode": "crc16",

                    "Poly": "a001",

                    "CrcLen": 2,

                    "StartIdx": 0,

                    "EndIdx": 2,

                    "PlaceIdx": 1,

                    "PlaceInvert": true,

                    "LittleEndian": true

                },

                "tagChecklist": [

                    {

                        "invert": false,

                        "index": 1,

                        "tag": "03"

                    },

                    {

                        "invert": false,

                        "index": 2,

                        "tag": "5E"

                    }

                ],

                "MulDev_NewGrpStart": true

            }

        ],

        "loraUpEventlist": [

            {

                "name": "random",

                "txBuffer": "1301",

                "confirmduty": "40",

                "periodMode": {

                    "periodValue": 4000,

                    "unit": "d"

                },

                "type": "normal",

                "txPort": 11,

                "upCond": "none"

            },

            {

                "name": "heart",

                "txBuffer": "0x812103 0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",

                "periodMode": {

                    "periodValue": 1,

                    "unit": "d"

                },

                "txPort": 61,

                "copyList": [

                    {

                        "CopyRule": "up[1].3=app.52.8"

                    },

                    {

                        "CopyRule": "up[1].11=app.61.4"

                    },

                    {

                        "CopyRule": "up[1].15=app.70.2"

                    },

                    {

                        "CopyRule": "up[1].17=app.80.1"

                    },

                    {

                        "CopyRule": "up[1].18=app.60.1"

                    },

                    {

                        "CopyRule": "up[1].19=app.29.3"

                    }

                ],

                "caculist": [

                    {

                        "CvtRule": "temp.80.1.uint=app.28.1.uint,>176"

                    }

                ],

                "confirmduty": "40",

                "type": "normal"

            },

            {

                "name": "MeterData",

                "txBuffer": "82 22 02 000000000000 00000000  0000 0000 0000 0000 0000 0000 00000000 0000 00000000 00000000 00000000 00000000 00",

                "periodMode": {

                    "periodValue": 4000,

                    "unit": "d"

                },

                "txPort": 12,

                "confirmduty": "40",

                "type": "normal",

                "caculist": [

                    {

                        "CvtRule": "app.15.1.uint=temp.80.1.uint,+appsts.3.1.uint,==0,*60,+1"

                    },

                    {

                        "CvtRule": "cond.11.1.uint=app.28.1.uint,<176,*temp.80.1.uint,<<3"

                    },

                    {

                        "CvtRule": "temp.64.1.uint=temp.64.1.uint,*1",

                        "CvtCond": "3",

                        "ActAfterCvt": "rst"

                    }

                ]

            }

        ]

    }

}
class EBeventList {
    constructor(data={}) {
        this.queryEventlist=(data.queryEventlist||[]).map(eventlist=>
            MT_quEvent.fromJSON(eventlist)
        )
        this.loraUpEventlist=(data.loraUpEventlist||[]).map(upEventList=>
            MT_upEvent.fromJSON(upEventList)
        )
    }
    static fromJSON(json){
        return new EBeventList(json)
    }
}
class EBcompile{

    _binBuffer = Buffer.alloc(0);

    constructor(data={}) {
        this.binopt=data.binopt
            ?EBeventList.fromJSON(data.binopt)
            : new EBeventList();
            
        this.bllPara=new MT_bllPara()
    }



    static fromJSON(json){
        return new EBcompile(json)
    }
    check(){
        if (this.binopt===null || this.binopt===undefined){
            return false
        }
        if (this.binopt.loraUpEventlist===null || this.binopt.loraUpEventlist===undefined){
            return false
        }
        return !(this.binopt.queryEventlist === null || this.binopt.queryEventlist === undefined);
    }
    compile(){
        if (!this.check()) {
            return null
        }
        for (let x of this.binopt.queryEventlist){
            x.SetBllPara(this.bllPara)
            x.GetQuPara()
        }
        for (let x of this.binopt.loraUpEventlist){
            x.SetBllPara(this.bllPara)
            x.GetUpTmplt()
        }
        let binBytes=this.bllPara.ToBytes()
        if (binBytes == null)
        {
            throw new Error("bll para is null")
        }
        if (binBytes.length > 2048)
        {
            throw new Error(`Binary buffer size exceeds limit: ${binBytes.length} bytes > 2048 bytes (2KB).`)
        }
        this._binBuffer = binBytes;
        return this
    }

    toBinFileContent() {
        let lstData = this._binBuffer;
        let lstBytes = [];
        let restLen = lstData.length;
        while (restLen > 0) {
            let readyToUseLen = 1022;
            if (restLen < 1022) readyToUseLen = restLen;
            let startIndex = lstData.length - restLen;
            let useData = lstData.slice(startIndex, startIndex + readyToUseLen);
            let BinBlock = this._buildBinBlock(useData, 1024);
            lstBytes.push(...BinBlock);
            restLen = restLen - readyToUseLen;
        }
        if (lstBytes.length == 1024) {
            lstBytes.push(...this._buildBinBlock([], 1024));
        }
        
        return Buffer.from([...lstBytes, ...lstBytes]);
    }
    
    _buildBinBlock(data, len) {
        let nextData = [0, 0, ...data];
        let paddingSize = len - data.length -2;
        paddingSize > 0 && nextData.push(...new Array(paddingSize).fill(0xFF));

        let crc = Utility.Sum(nextData, 2, len-2, 0);
        nextData[0] = crc & 0xff;
        nextData[1]= (crc >>> 8) & 0xff;

        return nextData;



    }
   
}
// let EBcompileInstance = new EBcompile(testlang)
// let buffer = EBcompileInstance.compile().toBinFileContent()


// let newBuffer = Buffer.alloc(2048-binBuffer.length).fill(0xFF);
// let outputBuffer= Buffer.concat([binBuffer,newBuffer]);

// fs.writeFileSync('output.bin', buffer);
// fs.appendFileSync('output.bin', outputBuffer);
module.exports = {
    EBBinCompile: EBcompile
}