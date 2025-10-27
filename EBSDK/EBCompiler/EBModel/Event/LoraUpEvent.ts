import { EBBuffer } from "../EBBuffer";
import { EBModel } from "../EBModel";
import { UpEventType } from "../EBEnum";
import { BaseEvent } from "./BaseEvent";
import { Buffer } from "buffer";

/**
 * LoraUpEvent class, used to represent a LoRa uplink event.
 */
export class LoraUpEvent extends BaseEvent {
    /** Static property to store the EBModel instance. */
  static ebModel: EBModel | null = null; 

  /**
   * Transmit data buffer.
   */
  public readonly txBuffer: EBBuffer; 
  /**
 * The index of the event in the EBModel instance.
 */
  public index!: number; 
  /** The transmission port. */
  public txPort: number; 

  /** The event type. */
  private type: UpEventType; 


  /**
   * Constructor
   * @param {string} name The name of the event.
   * @param {Object} options Event configuration.
   * @param {Buffer} options.txBuffer The transmission buffer.
   * @param {number} options.txPort The transmission port.
   * @param {UpEventType} [options.type=UpEventType.NORMAL] The event type, defaults to UpEventType.NORMAL.
   * @throws {Error} If LoraUpEvent.ebModel is not set.
   */
  constructor(
    name: string,
    {
      txBuffer,
      txPort,
      type = UpEventType.NORMAL,
    }: {
      txBuffer: Buffer;
      txPort: number;
      type?: UpEventType;
    }
  ) {
    if (!LoraUpEvent.ebModel) {
      throw new Error(
        'LoRaUpEvent.ebModel is not set, please use "LoRaUpEvent.ebModel = ebModel" code for initialization'
      );
    }
    super(name);
    let index = LoraUpEvent.ebModel?.getLoraUpEventCount();
    this.txBuffer = new EBBuffer(`up[${index}]`, txBuffer);
    this.txPort = txPort;
    this.type = type;
    LoraUpEvent.ebModel?.addEvent(this);
  }

  /**
   * Converts the event object to JSON format.
   * @returns A JSON object containing the event properties.
   */
  toJSON() {
    return {
      ...super.toJSON(),
      periodMode: this.queryPeriod,
      type: this.type,
      txPort: this.txPort,
      txBuffer: this.txBuffer
    };
  }
}