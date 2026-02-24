import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { EBModel, LoraUpEvent, QueryEvent, EBBuffer, VERSION } from "@EBSDK/EBCompiler/all_variable";
import path, { join } from "path";
import { OtaConfig } from "@EBSDK/otaConfig";

const {EBBinCompile} = require("./EBObin/eb-compile.js")
const {MT_BllObin} = require( "./EBObin/eb-bllObin.js")


export async function buildOtaFile (filePath:string|null, otaConfig:OtaConfig, MODBUS_TT:Function) {
  console.log("EBSDK VERSION => ",  VERSION);
  const ebModel = new EBModel(otaConfig);
  QueryEvent.ebModel = ebModel;
  LoraUpEvent.ebModel = ebModel;
  const APP = new EBBuffer("app", Buffer.alloc(255));

  new LoraUpEvent("random", {
    txBuffer: Buffer.from([130]),
    txPort: 11
  }).setPeriod(345600000);
  new QueryEvent("random", {
    cmdBuffer: Buffer.from([]),
    ackBuffer: Buffer.from([]),
  }).setPeriod(345600000)

  let heartTxBuffer=Buffer.from("8121030304050607080910111213141516171819".replaceAll(" ", ""), "hex")
  let heartLoraUpEvent = new LoraUpEvent("__heart__", {
      txBuffer: heartTxBuffer,
      txPort: 209
  }).setPeriod(86400) // default period is 1 day to keep alive with ThinkLink
  //copy parameters from APP para which can help to check the version and configuration of the device
  // reference file:https://mensikeji.yuque.com/staff-zesscp/gqdw7f/wi7zpgc14t6cfl9g?singleDoc#
  //copy 7 bytes to heart which including BzType and BzVersion for ThinkLink to check the result of EB upgrade
  heartLoraUpEvent.pushEBData(heartLoraUpEvent.txBuffer.copyFrom({
      bufferOffset: 0,
      byteLength: 7,
      buffer: APP
  }, 3))
  // copy 3 bytes which defined Chip Temperature and Battery voltage
  heartLoraUpEvent.pushEBData(heartLoraUpEvent.txBuffer.copyFrom({
      bufferOffset: 29,
      byteLength: 3,
      buffer: APP
  }, 10))

  // copy 6 bytes which including the pwron_dealy(power on delay)[2 bytes] and heart period[4 bytes]
  heartLoraUpEvent.pushEBData(heartLoraUpEvent.txBuffer.copyFrom({
      bufferOffset: 38,
      byteLength: 6,
      buffer: APP
  }, 13))
  // copy 1 bytes which is multidev_devicecount
  heartLoraUpEvent.pushEBData(heartLoraUpEvent.txBuffer.copyFrom({
      bufferOffset: 60,
      byteLength: 1,
      buffer: APP
  }, 19))

  let interJson = MODBUS_TT(ebModel)

  let EBcompileInstance = new EBBinCompile(JSON.parse(interJson))
  let binBuffer = EBcompileInstance.compile().toBinFileContent()


  let mtBllObin = new MT_BllObin(binBuffer, otaConfig);
  let obinString = mtBllObin.buildObin();


  if (filePath) {
     const dirpath = path.parse(filePath).dir
    const fileName = path.basename(dirpath);

    let releasePath = join(dirpath, "release");

    if (existsSync(releasePath)) {
      rmSync(releasePath, { recursive: true, force: true });
    }
    mkdirSync(releasePath, { recursive: true });
    console.log(join(releasePath, `${fileName}.ota`));

    writeFileSync(join(releasePath, `${fileName}.ota`), JSON.stringify(otaConfig));

    let outputPath = join(releasePath, `${fileName}.json`);
    writeFileSync(outputPath, interJson);

    writeFileSync(join(releasePath, `${fileName}.bin`), binBuffer);

    writeFileSync(join(releasePath, `${fileName}.obin`), obinString);

  }

  return {
    otaConfig: otaConfig,
    interJson: JSON.parse(interJson),
    binBuffer: binBuffer,
    obin: JSON.parse(obinString)
  }
}