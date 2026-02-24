import { OtaConfig } from "@EBSDK/otaConfig";
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
   * build-in buffer static member
   */
  /**
   * build-in buffer => new EBBuffer("app", Buffer.alloc(255));
   */
  static APP = new EBBuffer("app", Buffer.alloc(255));
  /**
   * build-in buffer => new EBBuffer("appsts", Buffer.alloc(32));
   */
  static APP_STATUS = new EBBuffer("appsts", Buffer.alloc(32));
  /**
   * build-in buffer => new EBBuffer("sensor", Buffer.alloc(128));
   */
  static SENSOR_DATA = new EBBuffer("sensor", Buffer.alloc(128));
  /**
   * build-in buffer => new EBBuffer("temp", Buffer.alloc(128));
   */
  static TEMPLATE = new EBBuffer("temp", Buffer.alloc(128));
  /**
   * build-in buffer => new EBBuffer("ds", Buffer.alloc(16));
   */
  static DEVICE_STATUS = new EBBuffer("ds", Buffer.alloc(16));

  /**
   * The current writing offset within the `SENSOR_DATA` buffer, used
   * exclusively for Change of Value (COV) calculations. This ensures
   * that multiple COV checks write to distinct memory locations.
   */
  public sensorDataBufferOffset = 0;
  /**
   * The current writing offset within the `TEMPLATE` buffer, used
   * exclusively for Change of Value (COV) calculations. This tracks
   * space for intermediate values like differences and comparison results.
  */
  public templateBufferOffset = 0;

  private LoraUpEventList: Array<LoraUpEvent> = []; 
  /** 
   * List of query events
   */
  private QueryEventList: Array<QueryEvent> = []; // 查询事件列表

  public otaConfig:OtaConfig = null;

  constructor(otaConfig) {
    this.otaConfig = otaConfig;
  }
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
