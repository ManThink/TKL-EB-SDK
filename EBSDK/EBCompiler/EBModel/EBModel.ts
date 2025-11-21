import { EBBuffer } from "./EBBuffer";
import { CrcMode, CrcPosition, ExprCondition } from "./EBEnum";
import { LoraUpEvent } from "./Event/LoraUpEvent";
import { QueryEvent } from "./Event/QueryEvent";
import { Buffer } from "buffer";


/**
 * ALL_VARIABLE class, used to define global constants.
 * These constants are typically used to limit buffer sizes or other global configurations.
 */
export class ALL_VARIABLE {
  /**
   * @deprecated This variable is a reserved field and its use is not recommended.
   * Maximum length of the "APPSTS" buffer.
   */
  static APPSTS_MAX_LENGTH: number = 32;

 /**
   * @deprecated This variable is a reserved field and its use is not recommended.
   * Maximum length of the "APP" buffer.
   */
  static APP_MAX_LENGTH: number = 255;

  /**
   * Maximum length of the "TEMP" buffer.
   */
  static TEMP_MAX_LENGTH: number = 128;

  /**
   * Maximum length of the "UP" buffer.
   */
  static UP_MAX_LENGTH: number = 1024;

  /**
   * Maximum length of the "ACK" buffer.
   */
  static ACK_MAX_LENGTH: number = 1024;
}

/**
 * EBModel class, used to manage LoRa uplink events and query events. 
 * Provides functionality to add events, get the event count, and generate JSON-formatted data.
 */
export class EBModel {
  /**
   * List of LoRa uplink events
   */
  private LoraUpEventList: Array<LoraUpEvent> = []; 
  /** 
   * List of query events
   */
  private QueryEventList: Array<QueryEvent> = []; // 查询事件列表


  constructor() {}
  /**
   * Gets the current number of LoRa uplink events.
   * @returns The number of LoRa uplink events.
   */
  getLoraUpEventCount(): number {
    return this.LoraUpEventList.length;
  }

  getQueryEventCount(): number {
    return this.QueryEventList.length;
  }

  /**
   * Adds an event to the event list.
   * @param event The event to add, which can be a LoRa uplink event(LoraUpEvent) or a query event(QueryEvent).
   * @throws {Error} If the event name is empty or the event type does not match.
   */
  public addEvent(event: LoraUpEvent | QueryEvent): void {
    const eventName = event?.getName();
    if (!eventName) {
      throw Error(`Please initialize the event name`);
    }
    if ([LoraUpEvent.name, QueryEvent.name].includes(event.constructor.name)) {
      if (event instanceof LoraUpEvent) {
        this.LoraUpEventList.push(event)
      } else if (event instanceof QueryEvent){
        this.QueryEventList.push(event);
      }
    } else {
      throw Error("Instance type mismatch, please use LoraUpEvent or QueryEvent");
    }
  }

   /**
   * Converts the current event list to JSON format.
   * @returns A JSON object containing the LoRa uplink events and query events.
   */
  public toJSON(): object {
    return {
      binopt: {
        loraUpEventlist: [
          ...this.LoraUpEventList,
        ],
        queryEventlist: [
          ...this.QueryEventList,
        ],
      },
    };
  }
}
