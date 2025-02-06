import 'reflect-metadata'
import { assignObject, concatToArrayOrString, getTarget, SESSION_CONFIGURATION_METADATA_KEY } from './common'
import { rcp } from '@kit.RemoteCommunicationKit'

export function getSessionConfiguration(target: Function | Object, isProto: boolean = false): rcp.SessionConfiguration {
  const prototype: Object = getTarget(target, isProto);

  const configuration: rcp.SessionConfiguration =
    Reflect.getMetadata(SESSION_CONFIGURATION_METADATA_KEY, prototype) ??
      {};
  return configuration;
}

export function setSessionConfiguration(target: Function | Object, configuration: rcp.SessionConfiguration,
  isProto: boolean = false): void {
  const prototype: Object = getTarget(target, isProto);

  Reflect.defineMetadata(SESSION_CONFIGURATION_METADATA_KEY, configuration, prototype,);
}

export function mergeSessionConfiguration(target: Function | Object, configuration: rcp.SessionConfiguration,
  isProto: boolean = false): void {

  const oldConfig = getSessionConfiguration(target, isProto);
  Object.keys(configuration).forEach(key => {
    const func = ConfigurationMergeFuncs[key];
    if (func) {
      func(key, oldConfig, configuration);
    }
  })

  setSessionConfiguration(target, oldConfig, isProto);
}












function executeInterceptors(key: string, configuration: rcp.SessionConfiguration,
  mergeConfiguration: rcp.SessionConfiguration) {
  const configArray: rcp.Interceptor[] = configuration[key] as rcp.Interceptor[] ?? [];
  const mergeArray: rcp.Interceptor[] = mergeConfiguration[key] as rcp.Interceptor[] ?? [];
  const set = new Set<rcp.Interceptor>();
  for (let i = 0; i < configArray.length; i++) {
    set.add(configArray[i]);
  }
  for (let i = 0; i < mergeArray.length; i++) {
    set.add(mergeArray[i]);
  }
  (configuration[key] as rcp.Interceptor[]) = Array.from(set.values());
  set.clear();
}


function executeRequestHeaders(key: string, configuration: rcp.SessionConfiguration,
  mergeConfiguration: rcp.SessionConfiguration) {
  (configuration[key] as rcp.RequestHeaders) = configuration[key] as rcp.RequestHeaders ?? {};
  const config = configuration[key] as rcp.RequestHeaders;
  const keys = Object.keys(configuration[key] as rcp.RequestHeaders)
    .concat(Object.keys(mergeConfiguration[key] as rcp.RequestHeaders));
  keys.forEach(hkey => {
    config[key] =
      concatToArrayOrString((configuration[key] as rcp.RequestHeaders)[hkey],
        (mergeConfiguration[key] as rcp.RequestHeaders)[hkey]);
  });
}

function executeCookies(key: string, configuration: rcp.SessionConfiguration,
  mergeConfiguration: rcp.SessionConfiguration) {
  (configuration[key] as rcp.RequestCookies) =
    (configuration[key] as rcp.RequestCookies) =
      assignObject(mergeConfiguration[key], configuration[key]) as rcp.RequestCookies;
}


function coverFunc(key: string, configuration: rcp.SessionConfiguration,
  mergeConfiguration: rcp.SessionConfiguration) {
  (configuration[key] as ESObject) = mergeConfiguration[key] as ESObject;

}


const RequestHeadersArrayAbleField: Record<string, boolean> =
  { 'user-agent': true, 'content-type': true, 'authorization': true }

type MergeFunc = (key: string, configuration: rcp.SessionConfiguration,
  mergeConfiguration: rcp.SessionConfiguration) => void;

const ConfigurationMergeFuncs: Record<string, MergeFunc> = {
  'interceptors': executeInterceptors,
  'requestConfiguration': coverFunc,
  'baseAddress': coverFunc,
  'headers': executeRequestHeaders,
  'cookies': executeCookies,
  'sessionListener': coverFunc,
  'connectionConfiguration': coverFunc
}