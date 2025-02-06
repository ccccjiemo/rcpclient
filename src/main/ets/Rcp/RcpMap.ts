import { rcp } from '@kit.RemoteCommunicationKit'
import { PropertyKey } from './common'
import { mergeRequestConfiguration } from './RequestConfiguration';


export function RcpMap<T>(func: (response: rcp.Response) => Promise<T>) {
  return (target: Object, propertyKey: PropertyKey,
    descriptor: TypedPropertyDescriptor<(...args: ESObject[]) => Promise<T>>) => {
    mergeRequestConfiguration(target, propertyKey, { map: func });
  }
}


async function responseToJson(response: rcp.Response): Promise<Object | null> {
  return response.toJSON();
}

async function responseToString(response: rcp.Response): Promise<string | null> {
  return response.toString();
}

export const ToJson = RcpMap(responseToJson);

export const ToString = RcpMap(responseToString);

export function ToMap<T>(target: Object, propertyKey: PropertyKey,
  descriptor: TypedPropertyDescriptor<(...args: ESObject[]) => Promise<T | null>>) {
  const func = async (response: rcp.Response) => {
    return response.toJSON() as T | null
  }
  mergeRequestConfiguration(target, propertyKey, { map: func });

}