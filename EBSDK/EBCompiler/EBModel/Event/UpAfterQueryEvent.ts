import { EBBuffer } from "../EBBuffer";
import { ExprCondition } from "../EBEnum";
import { EBExpr } from "../EBExpr";
import { CrcOption } from "../interface";
import { LoraUpEvent } from "./LoraUpEvent";
import { QueryEvent } from "./QueryEvent";


/**
 * @class UpAfterQueryEvent
 * @description A wrapper class that combines a QueryEvent and a LoraUpEvent, 
 * It is designed to simplify the common pattern of querying a device and then directly 
 * transferring the queried data via the LoraUpEvent.
 */

export class UpAfterQueryEvent {

  private queryEvent:QueryEvent;
  private loraUpEvent: LoraUpEvent;
    
  /**
   * The command buffer for the query event, exposed for direct manipulation.
   * This is equivalent to the cmdBuffer of the internal QueryEvent.
   */
  public queryCmdBuffer: EBBuffer;

   /**
   * Constructor for UpAfterQueryEvent.
   * @param name The base name for the events (QueryEvent will be 'name', LoraUpEvent will be 'upAfter' + 'name').
   * @param cmdbuffer The initial command buffer for the QueryEvent.
   * @param ackMaxlen The maximum length for the acknowledgment buffer, which is also used as the transmission buffer size for the LoraUpEvent.
   */
  constructor(name:string,cmdbuffer:Buffer,ackMaxlen:number) {

    let ackbuffer = Buffer.from("000000".replaceAll(" ", ""), "hex")
    this.queryEvent = new QueryEvent(name,{
        cmdBuffer:cmdbuffer,
        ackBuffer:ackbuffer,
    });
    this.queryCmdBuffer = this.queryEvent.cmdBuffer;

    let txBuffer = Buffer.alloc(ackMaxlen)
    this.loraUpEvent= new LoraUpEvent("upAfter"+name,{
        txBuffer:txBuffer,
        txPort:51,
    }).setPeriod(0x2FFF * 24 * 60 * 60) 

    this.queryEvent._setUpAfterQuery(this.loraUpEvent);
  }

  /**
   * Sets the period for the internal QueryEvent.
   * @param period The period value in seconds.
   * @param offsetSecond The offset in seconds (optional). 
   * - If provided, enables fixed-time acquisition with the specified offset;
   * - if omitted, disables fixed-time acquisition.
   * @returns The current object (for chaining).
   */
  setQueryPeriod(period: number, offsetSecond?: number):UpAfterQueryEvent {
    this.queryEvent.setPeriod(period, offsetSecond);
    return this
  }

   /**
   * Sets the query CRC parameters for the internal QueryEvent.
   * @param option CRC options.
   * @returns The current object (for chaining).
   */
  setQueryCrc(option: CrcOption): UpAfterQueryEvent {
    this.queryEvent.setQueryCrc(option);
    return this;
  }

  /**
   * Pushes an EB data operation (CalcData or CopyData) to the internal QueryEvent's action list.
   * This operation is executed *before* the query command is sent.
   * @param ebData The EB expression data (CalcData or CopyData).
   * @returns The current object (for chaining).
  */
  pushEBData<T extends EBExpr>(ebData:T) {
    this.queryEvent.pushEBData(ebData, {condition: ExprCondition.PRE})
    return this;
  }


}