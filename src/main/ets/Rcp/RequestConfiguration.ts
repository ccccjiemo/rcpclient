import { REQUEST_METADATA_KEY, PropertyKey, concatToArrayOrString } from "./common";
import 'reflect-metadata'
import { rcp } from "@kit.RemoteCommunicationKit";
import { ParamSet } from "./Params";
import { ResponseSet } from "./RcpResponseBody";


export interface RequestConfig {
  path?: string
  method?: rcp.HttpMethod
  headers?: rcp.RequestHeaders
  cookies?: rcp.RequestCookies
  configuration?: rcp.Configuration
  destination?: rcp.ResponseBodyDestination;
  map?: (response: rcp.Response, instance?: Object) => Promise<ESObject>
  params?: ParamSet[]
  retry?: number
  autoClose?: boolean
  response?: ResponseSet
}


export function getRequestConfiguration(target: Object, propertyKey: PropertyKey): RequestConfig {
  const config: RequestConfig = Reflect.getMetadata(
    REQUEST_METADATA_KEY,
    target,
    propertyKey
  ) ?? {};
  return config;
}

export function setRequestConfiguration(target: Object, propertyKey: PropertyKey, config: RequestConfig): void {
  Reflect.defineMetadata(REQUEST_METADATA_KEY, config, target, propertyKey);
}

export function mergeRequestConfiguration(target: Object, propertyKey: PropertyKey, config: RequestConfig): void {
  const configuration = getRequestConfiguration(target, propertyKey);
  Object.keys(config).forEach(key => {
    const func = MergeRequestConfigFunction[key];
    if (func) {
      func(key, configuration, config);
    }
  })
  setRequestConfiguration(target, propertyKey, configuration);
}


type MergeFunc = (key: string, configuration: RequestConfig, mergeConfiguration: RequestConfig) => void;

function coverFunc(key: string, configuration: Record<string, ESObject>,
  mergeConfiguration: Record<string, ESObject>): void {
  configuration[key] = mergeConfiguration[key];
}

function mergeHeaders(key: string, configuration: Record<string, ESObject>,
  mergeConfiguration: Record<string, ESObject>) {
  configuration[key] = concatToArrayOrString(configuration[key], mergeConfiguration[key]);
}

function mergeParams(key: string, configuration: Record<string, ESObject>,
  mergeConfiguration: Record<string, ESObject>) {
  configuration[key] = configuration[key] ?? [];
  configuration[key] = configuration[key].concat(mergeConfiguration[key]);
}

const MergeRequestConfigFunction: Record<string, MergeFunc> = {
  'path': coverFunc,
  'method': coverFunc,
  'headers': mergeHeaders,
  'cookies': coverFunc,
  'configuration': coverFunc,
  'destination': coverFunc,
  'map': coverFunc,
  'params': mergeParams,
  'retry': coverFunc,
  'autoClose': coverFunc,
  'response': coverFunc
}
