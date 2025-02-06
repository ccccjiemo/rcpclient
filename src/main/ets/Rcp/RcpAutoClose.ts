import { PropertyKey } from "./common";
import { mergeRequestConfiguration } from "./RequestConfiguration";

export function RcpAutoClose(target: Object, propertyKey: PropertyKey, descriptor: PropertyDescriptor) {
  mergeRequestConfiguration(target, propertyKey, { autoClose: true })
}