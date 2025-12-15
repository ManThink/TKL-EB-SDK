export interface OtaConfig {
  UpgradeOption: {
    /** 
     * @description Upgrade method
     * @example 
     * - gw: Upgrade online via gateway
     * - sp: Upgrade via serial port
     */
    UpgrdType: "gw" | "sp";
    AppEui: string;
    Addr: string;
    devEUI: Array<{
      deveui_start: string;
      deveui_end: string;
    }>;
  };
  AppPara: {
    FuotaVersion: number;
    /** 
     * @description Hardware type identifier
     * @example 
     * - 40: om422   
     * - 51: om822 
     */
    HwType: HwTypeEnum;
    HwVersion: number;
    SwVersion: number;
    BzType: number;
    BzVersion: number;
    FilterMask: number;
    OtaMask: number;  
    WakeupIn: boolean;
    WakeupOut: boolean;
    BackHaul: string;
    /** 
     * Baud rate
     * @description Must be an integer multiple of 1200 
     * @example 1200
     * @example 112500
     */
    BaudRate: number;
    /** 
     * @description Stop bits 
     */
    StopBits: number;
    /** 
     * @description Data bits
     */
    DataBits: number;
    /** 
     * @description Check bit
     * @example 
     * - none No parity
     * - even Even parity
     * - odd  Odd parity
     */
    Checkbit: CheckbitEnum;
    TransparentBit: boolean;
    /**
     * @description After the query event is executed, the data received from the serial port is directly passed through without processing.
     */
    UpRawAfterQuery: boolean;
    /** 
     * @description Whether it is battery powered
     */
    Battery: boolean;
    Uart1Used: boolean;
    JoinRst: boolean;
    SwUp: boolean;
    TDMA: boolean;
    PowerCtrl: boolean;
    Wait60s: boolean;
    ConfirmDuty: number;
    portPara: number;
    portTransparent: number;
    RstHours: number;
    TimeOffset: number;
  };
}

export enum HwTypeEnum {
  OM422 = 40,
  OM822 = 51
}

export enum CheckbitEnum {
  NONE = "none",
  ODD = "odd",
  EVEN = "even"
}
export enum UpgrdTypeEnum{
  GW = "gw",
  SP = "sp"
}

export interface GetOtaConfigInput {
  UpgrdType?: OtaConfig["UpgradeOption"]["UpgrdType"];

  HwType?: OtaConfig["AppPara"]["HwType"];
  
  BaudRate: OtaConfig["AppPara"]["BaudRate"];
  
  StopBits: OtaConfig["AppPara"]["StopBits"];
  
  DataBits: OtaConfig["AppPara"]["DataBits"];
  
  Checkbit: OtaConfig["AppPara"]["Checkbit"];
  
  Battery: OtaConfig["AppPara"]["Battery"];
  /** 
   * @description The duty cycle of the LoRaWAN uplink confirmation packet, indicating how many data packets are sent before a confirmation packet is sent.
   */
  ConfirmDuty: OtaConfig["AppPara"]["ConfirmDuty"];
  BzType: number;
  BzVersion: number;

  FuotaVersion?: number;
  HwVersion?: number;
  SwVersion?: number;
  
  FilterMask?: number;
  OtaMask?: number;  
  WakeupIn?: boolean;
  WakeupOut?: boolean;
  BackHaul?: string;

  TransparentBit?: boolean;
  /**
   * @description After the query event is executed, the data received from the serial port is directly passed through without processing.
   */
  UpRawAfterQuery?: boolean;
  /** 
   * @description Whether it is battery powered
   */
  Uart1Used?: boolean;
  JoinRst?: boolean;
  SwUp?: boolean;
  TDMA?: boolean;
  PowerCtrl?: boolean;
  Wait60s?: boolean;
  portPara?: number;
  portTransparent?: number;
  RstHours?: number;
  TimeOffset?: number;
}

/**
 * @description Generates the OtaConfig object from the input configuration.
 * @param otaConfig The input configuration for OTA.
 * @returns The generated OtaConfig object.
 * @throws An error if required fields are missing or BaudRate is invalid.
 */
export const getOtaConfig = (otaConfig: GetOtaConfigInput):OtaConfig =>{
 
  // if(!otaConfig.UpgrdType) {
  //   throw new Error("UpgrdType is required");

  // }
  // let UpgrdType = otaConfig.UpgrdType;
  let otaConfigCopy = JSON.parse(JSON.stringify(otaConfig));
  delete otaConfigCopy.UpgrdType;
  let appPara = otaConfigCopy;
  if(appPara.BaudRate % 1200 != 0) {
    throw new Error("BaudRate must be an integer multiple of 1200.");
  } 
  let notNullFields = [
    "HwType", "BzType", "BzVersion", "BaudRate", 
    "StopBits", "DataBits", "Checkbit", "Battery",
    "ConfirmDuty"
  ]

  notNullFields.forEach((key:string) => {
    if (appPara[key] == null) {
      throw new Error(`${key} is required`)
    }
  })

  return {
    "UpgradeOption": {
      "UpgrdType": UpgrdTypeEnum.GW,
      "AppEui": "8100000002000001",
      "Addr": "0x02",
      "devEUI": [
        {
          "deveui_start": "0000000000000000",
          "deveui_end": "0000000000000000"
        }
      ]
    },
    "AppPara": {
      "FuotaVersion": 1,
      "HwType": HwTypeEnum.OM822,
      "HwVersion": 2,
      "SwVersion": 30,
      // "BzType": 416,
      // "BzVersion": 10, 
      "FilterMask": 1,
      "OtaMask": 6,
      "WakeupIn": false,
      "WakeupOut": false,
      "BackHaul": "bh_lorawan",
      // "BaudRate": BaudRate,
      // "StopBits": StopBits,
      // "DataBits": DataBits,
      // "Checkbit": Checkbit,
      "TransparentBit": false,
      "UpRawAfterQuery": false,
      // "Battery":Battery,
      "Uart1Used": false,
      "JoinRst": false,
      "SwUp": false,
      "TDMA": true,
      "PowerCtrl": false,
      "Wait60s": false,
      // "ConfirmDuty": ConfirmDuty,
      "portPara": 71,
      "portTransparent": 51,
      "RstHours":240,
      "TimeOffset": 0,
      ...appPara
    }
  }
}
  


