export interface OtaConfig {
  UpgradeOption: {
    /** 
     * @description 升级方式
     * @example 
     * - gw: 通过网关在线升级
     * - sp: 通过串口方式升级
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
     * @description  硬件类型标识
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
     * 波特率
     * @description 1200的整数倍 
     * @example 1200
     * @example 112500
     */
    BaudRate: number;
    /** 
     * @description 停止位 
     */
    StopBits: number;
    /** 
     * @description 数据位
     */
    DataBits: number;
    /** 
     * @description 校验位
     * @example 
     * - none 无校验
     * - even 偶校验
     * - odd  奇校验
     */
    Checkbit: CheckbitEnum;
    TransparentBit: boolean;
    KeepRx: boolean;
    /** 
     * @description 是否是电池供电
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

interface GetOtaConfigInput {
  UpgrdType: OtaConfig["UpgradeOption"]["UpgrdType"];

  HwType: OtaConfig["AppPara"]["HwType"];
  
  BaudRate: OtaConfig["AppPara"]["BaudRate"];
  
  StopBits: OtaConfig["AppPara"]["StopBits"];
  
  DataBits: OtaConfig["AppPara"]["DataBits"];
  
  Checkbit: OtaConfig["AppPara"]["Checkbit"];
  
  Battery: OtaConfig["AppPara"]["Battery"];
  /** 
   * @description LoRaWAN上行confirm包的占控比, 每多少包数据中发送一个confirm包
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
  KeepRx?: boolean;
  /** 
   * @description 是否是电池供电
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

export const getOtaConfig = (otaConfig: GetOtaConfigInput):OtaConfig =>{
 
  if(!otaConfig.UpgrdType) {
    throw new Error("UpgrdType is required");

  }
  let UpgrdType = otaConfig.UpgrdType;
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
      "UpgrdType": UpgrdType,
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
      // "HwType": HwType,
      "HwVersion": 2,
      "SwVersion": 30,
      // "BzType": 416,
      // "BzVersion": 10, 
      "FilterMask": 0,
      "OtaMask": 7,
      "WakeupIn": false,
      "WakeupOut": false,
      "BackHaul": "bh_lorawan",
      // "BaudRate": BaudRate,
      // "StopBits": StopBits,
      // "DataBits": DataBits,
      // "Checkbit": Checkbit,
      "TransparentBit": false,
      "KeepRx": false,
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
  

