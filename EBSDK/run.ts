import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { CalcData, CrcMode, EBBuffer, EBModel, ExprCondition, LoraUpEvent, QueryEvent } from "./EBCompiler/all_variable";
import path, { join, resolve } from "path";
import { OtaConfig } from "./otaConfig";

const {EBBinCompile} = require("./EBObin/eb-compile.js")
const {MT_BllObin} = require( "./EBObin/eb-bllObin.js")


export async function buildOtaFile (filePath:string, otaConfig:OtaConfig, MODBUS_TT:Function) {
  const ebModel = new EBModel();
  QueryEvent.ebModel = ebModel;
  LoraUpEvent.ebModel = ebModel;
  new LoraUpEvent("random", {
    txBuffer: Buffer.from([130]),
    txPort: 11
  }).setPeriod(345600000);
  new QueryEvent("random", {
    cmdBuffer: Buffer.from([]),
    ackBuffer: Buffer.from([]),
  }).setPeriod(345600000)

  // let fileName = fileName
  const dirpath = path.parse(filePath).dir
  const fileName = path.basename(dirpath);

  let releasePath = join(dirpath, "release");

  if (existsSync(releasePath)) {
    rmSync(releasePath, { recursive: true, force: true });
  }
  mkdirSync(releasePath, { recursive: true });

  console.log(join(releasePath, `${fileName}.ota`));
  // 生成升级包所需的ota文件
  writeFileSync(join(releasePath, `${fileName}.ota`), JSON.stringify(otaConfig));

  // 生成过程中的json文件
  let outputPath = join(releasePath, `${fileName}.json`);
  let origin_data_string = MODBUS_TT(ebModel)
  writeFileSync(outputPath, origin_data_string);

  // 通过json文件生成bin文件, 
  let EBcompileInstance = new EBBinCompile(JSON.parse(origin_data_string))
  let buffer = EBcompileInstance.compile().toBinFileContent()

  writeFileSync(join(releasePath, `${fileName}.bin`), buffer);

  // 查询bin文件以及对应的同名ota文件进行bin文件的生成
  let outputBin = join(releasePath, `${fileName}.bin`);
  let mtBllObin = new MT_BllObin(outputBin,otaConfig.AppPara.Battery);
  mtBllObin.buildObin(outputBin);

}