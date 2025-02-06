import { rcp } from "@kit.RemoteCommunicationKit";
import HashMap from "@ohos.util.HashMap";

export const INTERCEPTOR_METADATA_KEY = Symbol('design:rcp_interceptor');

export const REQUEST_METADATA_KEY = Symbol('design:rcp_request');

export const PARAM_METADATA_KEY = Symbol('design:rcp_param');

export const SESSION_METADATA_KEY = Symbol('design:rcp_session');

export const SESSION_CONFIGURATION_METADATA_KEY = Symbol('design:rcp_session_configuration');

export const NOT_REQUEST = Symbol('design:rcp_not_request');

export const INTERCEPTOR_STORE_THIS = Symbol('design:interceptor_store_this');


export type PropertyKey = string | symbol;

export type MethodOrClassDecorator = ClassDecorator & MethodDecorator;

export interface ApiConfig {
  baseUri: rcp.URLOrString
}

export function getPropertyDescriptor(target: any, key: PropertyKey): PropertyDescriptor | undefined {
  return Object.getOwnPropertyDescriptor(target, key);
}

export type RequestDecorator = {
  (path: string, configuration?: rcp.Configuration): MethodDecorator;
  (target: Object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): void;
}

const RcpInstanceCache: HashMap<{ new(): any }, any> = new HashMap();

export function createInstance<T>(constructor: { new(): T }): T {
  if (RcpInstanceCache.hasKey(constructor)) {
    return RcpInstanceCache.get(constructor) as T;
  } else {
    let obj = new constructor();
    RcpInstanceCache.set(constructor, obj);
    return obj;
  }
}

export function removeInstance<T>(constructor: { new(...args: any[]): T }): T {
  if (RcpInstanceCache.hasKey(constructor)) {
    return RcpInstanceCache.remove(constructor);
  }
}

export function getTarget(target: Function | Object, isProto: boolean = false): Object {
  if (typeof target === 'function') {
    return isProto ? target.prototype : target;
  } else {
    return isProto ? target.constructor.prototype : target.constructor;
  }
}

export function concatToArrayOrString(
  value1: string | string[] | undefined,
  value2: string | string[] | undefined
): string | string[] | undefined {
  // Handle both undefined case
  if (value1 === undefined && value2 === undefined) {
    return undefined;
  }

  // Handle single undefined cases
  if (value1 === undefined) {
    return value2;
  }
  if (value2 === undefined) {
    return value1;
  }

  // Normalize inputs to arrays (wrap strings in array)
  const arr1 = typeof value1 === 'string' ? [value1] : value1;
  const arr2 = typeof value2 === 'string' ? [value2] : value2;

  // Merge and deduplicate
  const merged = [...arr1, ...arr2];
  const uniqueItems = [...new Set(merged)];

  // Return single element or array
  return uniqueItems.length === 1 ? uniqueItems[0] : uniqueItems;
}

export function assignObject(value1: Object, value2: Object) {
  return Object.assign(value1, value2);
}

export function shallowCopy<T extends Object>(obj: T): T {
  return { ...obj };
}

export const getThis = () => {
  return this;
}

export const RequestFunc = (path: string, method: string) => {
  return function (this: any, ...args: any[]) {

  }
}