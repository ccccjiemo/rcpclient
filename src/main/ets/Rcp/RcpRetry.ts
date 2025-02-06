import { PropertyKey } from "./common";
import { mergeRequestConfiguration } from "./RequestConfiguration";

export function RcpRetry(times: number) {
  return (target: Object, propertyKey: PropertyKey, descriptor: PropertyDescriptor) => {
    mergeRequestConfiguration(target, propertyKey, { retry: times })
  }
}