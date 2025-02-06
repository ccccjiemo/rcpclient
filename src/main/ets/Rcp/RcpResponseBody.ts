import { rcp } from "@kit.RemoteCommunicationKit";
import { PropertyKey } from "./common";
import { mergeRequestConfiguration } from "./RequestConfiguration";


type ResponseType = 'incomingdatacallback' | 'downloadtofile' | 'downloadtostream' | 'networkoutputqueue'

export interface ResponseSet {
  type: ResponseType
  value: string | rcp.IncomingDataCallback | rcp.DownloadToFile | rcp.DownloadToStream | rcp.INetworkOutputQueue
}

export function createResponseDecorator(type: ResponseType,
  callback: string | rcp.IncomingDataCallback | rcp.DownloadToFile | rcp.DownloadToStream | rcp.INetworkOutputQueue) {
  return (target: Object, propertyKey: PropertyKey, descriptor: PropertyDescriptor) => {
    const response: ResponseSet = {
      type: type,
      value: callback
    }
    mergeRequestConfiguration(target, propertyKey, { response: response })
  }
}

export function getResponseBodyDestination(instance: Object,
  responseSet?: ResponseSet): rcp.ResponseBodyDestination {
  if (!responseSet) {
    return 'array-buffer';
  }
  const response = typeof responseSet.value === 'string' ? instance[responseSet.value] : responseSet.value;
  if (responseSet.type === 'incomingdatacallback') {
    response.bind(instance);
  }
  return response;
}

