import { CalcData, CopyData, EBExpr } from "./EBExpr";
import {Buffer} from "buffer"

/**
 * EB编译器的自定义类, 用于存储计算赋值动作以及复制动作中Buffer的读取,写入相关的动作过程
 */
export class EBBuffer {
  /** 缓冲区的名称 */ 
  private name: string;
  /** 缓冲区元数据 */
  private buffer:Buffer = Buffer.alloc(0);
  /** buffer缓冲区的最大长度 */ 
  private maxLength: number = 0;

  /** 
   * 构造函数，初始化缓冲区名称和缓冲区数据，并根据传入的buffer设置最大长度
   */ 
  constructor(name:string, buffer:Buffer) {
    this.name = name;
    this.buffer = buffer;
    this.maxLength = buffer.length;
  }

  /** 获取缓存区 */ 
  getBuffer():Buffer {
    return this.buffer;
  }

  /** 获取EBBuffer实例的名称 */
  getName():string {
    return this.name;
  }

  /** 将缓冲区数据转换为十六进制字符串 */ 
  toJSON() {
    return this.buffer.toString("hex")?.match(/.{2}/g)?.join(' ')?.toUpperCase() || "";
  }
  /** 
   * 从传入的EBbuffer中复制数据到当前的EBBuffer中
   * @param source 传入的数据信息,包含以下属性：
   *  - bufferOffset: 当前缓存区的偏移量, 表示从哪个位置开始读取数据到当前实例中
   *  - byteLength: 要复制的字节数
   *  - buffer: 要复制的源缓存区
   * @param {number} bufferOffset 当前缓存区的偏移量, 表示从哪个位置开始写入数据到当前实例中
   * @return {CopyData} 返回一个CopyData对象, 并且设置改对象为只读对象, 无法再进行其他操作符运算
   */ 
  copyFrom(source: {
    bufferOffset: number;
    byteLength: number;
    buffer:EBBuffer
  }, bufferOffset: number):CopyData {
    let vale = source.buffer._readCopySource( source.bufferOffset, source.byteLength).getValue();
    return new CopyData(`${this.name}.${bufferOffset}=${vale}`, true)
  }

  /** 从当前缓冲区读取数据，用于内部复制操作 
   * @param {number} bufferOffset 当前缓存区的偏移量, 表示从哪个位置开始读取数据
   * @param {number} byteLength 要读取的字节数
   * @return {CopyData} 返回一个CopyData对象
   */ 
  _readCopySource(bufferOffset:number, byteLength:number):CopyData {
    return new CopyData(`${this.name}.${bufferOffset}.${byteLength}`);
  }

  /**
   * 读取无符号整数（小端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @param {number} byteLength - 读取的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  readUintLE( bufferOffset:number, byteLength:number):CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.uint`);
  }

  /**
   * 写入无符号整数（小端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @param {number} byteLength - 写入的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  writeUintLE(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readUintLE(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取无符号整数（大端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @param {number} byteLength - 读取的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  readUintBE(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.uint.b`);
  }

  /**
   * 写入无符号整数（大端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @param {number} byteLength - 写入的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  writeUintBE(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readUintBE(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取有符号整数（小端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @param {number} byteLength - 读取的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  readIntLE(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.int`);
  }

  /**
   * 写入有符号整数（小端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @param {number} byteLength - 写入的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  writeIntLE(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readIntLE(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取有符号整数（大端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @param {number} byteLength - 读取的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  readIntBE(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.int.b`);
  }

  /**
   * 写入有符号整数（大端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @param {number} byteLength - 写入的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  writeIntBE(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readIntBE(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取无符号8位整数
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readUint8(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.1.uint`);
  }

  /**
   * 写入无符号8位整数
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeUint8(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readUint8(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取无符号16位整数（小端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readUint16LE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.2.uint`);
  }

  /**
   * 写入无符号16位整数（小端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeUint16LE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readUint16LE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取无符号16位整数（大端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readUint16BE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.2.uint.b`);
  }

  /**
   * 写入无符号16位整数（大端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeUint16BE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readUint16BE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取有符号8位整数
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readInt8(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.1.int`);
  }

  /**
   * 写入有符号8位整数
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeInt8(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readInt8(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取有符号16位整数（小端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readInt16LE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.2.int`);
  }

  /**
   * 写入有符号16位整数（小端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeInt16LE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readInt16LE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取有符号16位整数（大端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readInt16BE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.2.int.b`);
  }

  /**
   * 写入有符号16位整数（大端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeInt16BE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readInt16BE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取无符号32位整数（小端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readUint32LE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.4.uint`);
  }

  /**
   * 写入无符号32位整数（小端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeUint32LE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readUint32LE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取无符号32位整数（大端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readUint32BE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.4.uint.b`);
  }

  /**
   * 写入无符号32位整数（大端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeUint32BE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readUint32BE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取有符号32位整数（小端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readInt32LE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.4.int`);
  }

  /**
   * 写入有符号32位整数（小端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeInt32LE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readInt32LE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取有符号32位整数（大端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readInt32BE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.4.int.b`);
  }

  /**
   * 写入有符号32位整数（大端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeInt32BE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readInt32BE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取浮点数（小端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readFloatLE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.4.float`);
  }

  /**
   * 写入浮点数（小端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeFloatLE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readFloatLE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取浮点数（大端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readFloatBE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.4.float.b`);
  }

  /**
   * 写入浮点数（大端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeFloatBE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readFloatBE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取双精度浮点数（小端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readDoubleLE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.8.double`);
  }

  /**
   * 写入双精度浮点数（小端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeDoubleLE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readDoubleLE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取双精度浮点数（大端字节序）
   * @param {number} bufferOffset - 读取的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  readDoubleBE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.8.double.b`);
  }

  /**
   * 写入双精度浮点数（大端字节序）
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @returns {CalcData} - 返回计算结果
   */
  writeDoubleBE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readDoubleBE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取ASCII字符串
   * @param {number} bufferOffset - 读取的偏移量
   * @param {number} byteLength - 读取的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  readAscii(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.asc`);
  }

  /**
   * 写入ASCII字符串
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @param {number} byteLength - 写入的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  writeAscii(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readAscii(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取XAASC字符串
   * @param {number} bufferOffset - 读取的偏移量
   * @param {number} byteLength - 读取的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  readXaasc(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.xaasc`);
  }

  /**
   * 写入XAASC字符串
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @param {number} byteLength - 写入的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  writeXaasc(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readXaasc(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取XAF字符串
   * @param {number} bufferOffset - 读取的偏移量
   * @param {number} byteLength - 读取的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  readXaf(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.xaf`);
  }

  /**
   * 写入XAF字符串
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @param {number} byteLength - 写入的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  writeXaf(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readXaf(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * 读取BCD码
   * @param {number} bufferOffset - 读取的偏移量
   * @param {number} byteLength - 读取的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  readBcd(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.bcd`);
  }

  /**
   * 写入BCD码
   * @param {CalcData} value - 要写入的值
   * @param {number} offset - 写入的偏移量
   * @param {number} byteLength - 写入的字节长度
   * @returns {CalcData} - 返回计算结果
   */
  writeBcd(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readBcd(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }
}