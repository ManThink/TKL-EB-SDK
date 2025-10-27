import { CalcData, CopyData, EBExpr } from "./EBExpr";
import {Buffer} from "buffer"

/**
 * Custom class for the EB compiler, used to store the process of read/write operations
 * on a Buffer for calculation and copy actions.
 */
export class EBBuffer {
  /** The name of the buffer */ 
  private name: string;
  /** The buffer metadata */
  private buffer:Buffer = Buffer.alloc(0);
  /** The maximum length of the buffer */ 
  private maxLength: number = 0;

  /** 
   * Constructor. Initializes the buffer name and data, and sets the maximum length
   * based on the provided buffer.
   * @param name The name of the buffer.
   * @param buffer The initial Buffer object.
   */ 
  constructor(name:string, buffer:Buffer) {
    this.name = name;
    this.buffer = buffer;
    this.maxLength = buffer.length;
  }

  /** Gets the underlying Buffer object. */ 
  getBuffer():Buffer {
    return this.buffer;
  }

  /** Gets the name of the EBBuffer instance. */
  getName():string {
    return this.name;
  }

  /** Converts the buffer data to a hexadecimal string. */ 
  toJSON() {
    return this.buffer.toString("hex")?.match(/.{2}/g)?.join(' ')?.toUpperCase() || "";
  }
  
  /** 
   * Copies data from a source EBBuffer to the current EBBuffer.
   * @param source The source data information, including:
   *  - bufferOffset: The offset in the source buffer to start reading from.
   *  - byteLength: The number of bytes to copy.
   *  - buffer: The source EBBuffer.
   * @param bufferOffset The offset in the current buffer to start writing to.
   * @returns A CopyData object representing the copy action, set as read-only.
   */ 
  copyFrom(source: {
    bufferOffset: number;
    byteLength: number;
    buffer:EBBuffer
  }, bufferOffset: number):CopyData {
    let vale = source.buffer._readCopySource( source.bufferOffset, source.byteLength).getValue();
    return new CopyData(`${this.name}.${bufferOffset}=${vale}`, true)
  }

  /** 
   * Reads data from the current buffer for internal copy operations.
   * @param bufferOffset The offset in the current buffer to start reading from.
   * @param byteLength The number of bytes to read.
   * @returns A CopyData object.
   */ 
  _readCopySource(bufferOffset:number, byteLength:number):CopyData {
    return new CopyData(`${this.name}.${bufferOffset}.${byteLength}`);
  }

  /**
   * Reads an unsigned integer (Little Endian).
   * @param bufferOffset The offset to start reading from.
   * @param byteLength The length in bytes to read.
   * @returns The result as a CalcData object.
   */
  readUintLE( bufferOffset:number, byteLength:number):CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.uint`);
  }

  /**
   * Writes an unsigned integer (Little Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @param byteLength The length in bytes to write.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeUintLE(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readUintLE(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads an unsigned integer (Big Endian).
   * @param bufferOffset The offset to start reading from.
   * @param byteLength The length in bytes to read.
   * @returns The result as a CalcData object.
   */
  readUintBE(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.uint.b`);
  }

  /**
   * Writes an unsigned integer (Big Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @param byteLength The length in bytes to write.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeUintBE(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readUintBE(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads a signed integer (Little Endian).
   * @param bufferOffset The offset to start reading from.
   * @param byteLength The length in bytes to read.
   * @returns The result as a CalcData object.
   */
  readIntLE(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.int`);
  }

  /**
   * Writes a signed integer (Little Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @param byteLength The length in bytes to write.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeIntLE(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readIntLE(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads a signed integer (Big Endian).
   * @param bufferOffset The offset to start reading from.
   * @param byteLength The length in bytes to read.
   * @returns The result as a CalcData object.
   */
  readIntBE(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.int.b`);
  }

  /**
   * Writes a signed integer (Big Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @param byteLength The length in bytes to write.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeIntBE(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readIntBE(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads an unsigned 8-bit integer.
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readUint8(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.1.uint`);
  }

  /**
   * Writes an unsigned 8-bit integer.
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeUint8(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readUint8(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads an unsigned 16-bit integer (Little Endian).
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readUint16LE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.2.uint`);
  }

  /**
   * Writes an unsigned 16-bit integer (Little Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeUint16LE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readUint16LE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads an unsigned 16-bit integer (Big Endian).
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readUint16BE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.2.uint.b`);
  }

  /**
   * Writes an unsigned 16-bit integer (Big Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeUint16BE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readUint16BE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads a signed 8-bit integer.
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readInt8(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.1.int`);
  }

  /**
   * Writes a signed 8-bit integer.
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeInt8(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readInt8(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads a signed 16-bit integer (Little Endian).
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readInt16LE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.2.int`);
  }

  /**
   * Writes a signed 16-bit integer (Little Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeInt16LE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readInt16LE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads a signed 16-bit integer (Big Endian).
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readInt16BE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.2.int.b`);
  }

  /**
   * Writes a signed 16-bit integer (Big Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeInt16BE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readInt16BE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads an unsigned 32-bit integer (Little Endian).
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readUint32LE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.4.uint`);
  }

  /**
   * Writes an unsigned 32-bit integer (Little Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeUint32LE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readUint32LE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads an unsigned 32-bit integer (Big Endian).
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readUint32BE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.4.uint.b`);
  }

  /**
   * Writes an unsigned 32-bit integer (Big Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeUint32BE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readUint32BE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads a signed 32-bit integer (Little Endian).
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readInt32LE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.4.int`);
  }

  /**
   * Writes a signed 32-bit integer (Little Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeInt32LE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readInt32LE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads a signed 32-bit integer (Big Endian).
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readInt32BE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.4.int.b`);
  }

  /**
   * Writes a signed 32-bit integer (Big Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeInt32BE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readInt32BE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads a 32-bit floating point number (Little Endian).
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readFloatLE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.4.float`);
  }

  /**
   * Writes a 32-bit floating point number (Little Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeFloatLE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readFloatLE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads a 32-bit floating point number (Big Endian).
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readFloatBE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.4.float.b`);
  }

  /**
   * Writes a 32-bit floating point number (Big Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeFloatBE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readFloatBE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads a 64-bit floating point number (Little Endian).
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readDoubleLE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.8.double`);
  }

  /**
   * Writes a 64-bit floating point number (Little Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeDoubleLE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readDoubleLE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads a 64-bit floating point number (Big Endian).
   * @param bufferOffset The offset to start reading from.
   * @returns The result as a CalcData object.
   */
  readDoubleBE(bufferOffset: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.8.double.b`);
  }

  /**
   * Writes a 64-bit floating point number (Big Endian).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeDoubleBE(value: CalcData, offset: number): CalcData {
    return new CalcData(`${this.readDoubleBE(offset).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads an ASCII string.
   * @param bufferOffset The offset to start reading from.
   * @param byteLength The length in bytes to read.
   * @returns The result as a CalcData object.
   */
  readAscii(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.asc`);
  }

  /**
   * Writes an ASCII string.
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @param byteLength The length in bytes to write.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeAscii(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readAscii(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads an XAASC string (a custom format).
   * @param bufferOffset The offset to start reading from.
   * @param byteLength The length in bytes to read.
   * @returns The result as a CalcData object.
   */
  readXaasc(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.xaasc`);
  }

  /**
   * Writes an XAASC string (a custom format).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @param byteLength The length in bytes to write.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeXaasc(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readXaasc(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads an XAF string (a custom format).
   * @param bufferOffset The offset to start reading from.
   * @param byteLength The length in bytes to read.
   * @returns The result as a CalcData object.
   */
  readXaf(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.xaf`);
  }

  /**
   * Writes an XAF string (a custom format).
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @param byteLength The length in bytes to write.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeXaf(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readXaf(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }

  /**
   * Reads a BCD (Binary-Coded Decimal) value.
   * @param bufferOffset The offset to start reading from.
   * @param byteLength The length in bytes to read.
   * @returns The result as a CalcData object.
   */
  readBcd(bufferOffset: number, byteLength: number): CalcData {
    return new CalcData(`${this.name}.${bufferOffset}.${byteLength}.bcd`);
  }

  /**
   * Writes a BCD (Binary-Coded Decimal) value.
   * @param value The value to write.
   * @param offset The offset to start writing to.
   * @param byteLength The length in bytes to write.
   * @returns The result as a CalcData object (assignment expression).
   */
  writeBcd(value: CalcData, offset: number, byteLength: number): CalcData {
    return new CalcData(`${this.readBcd(offset, byteLength).getValue()}=${value.getValue()}`, true);
  }
}
