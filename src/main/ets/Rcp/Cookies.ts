import { rcp } from "@kit.RemoteCommunicationKit";
import { MethodOrClassDecorator, PropertyKey } from "./common";
import { addParam, RcpParam } from "./Params";
import { mergeRequestConfiguration } from "./RequestConfiguration";
import { mergeSessionConfiguration } from "./SessionConfiguration";


// 函数重载声明
export function RcpCookies(value: rcp.RequestCookies): MethodOrClassDecorator;

export function RcpCookies(key: string, value: string): MethodOrClassDecorator;

export function RcpCookies(target: Object, propertyKey: PropertyKey, parameterIndex: number): void

export function RcpCookies(valueOrKey: rcp.RequestCookies | string | Object, valueOrPropertyKey?: string | PropertyKey,
  parameterIndex?: number): ESObject {
  //function RcpCookie(key: string, value: string): MethodOrClassDecorator;
  if (typeof valueOrKey === 'string') {
    return (target: Object | Function, propertyKey?: PropertyKey, descriptor?: PropertyDescriptor) => {
      if (typeof target === 'function') {
        mergeSessionConfiguration(target, { cookies: { valueOrKey: valueOrPropertyKey as string } });
      } else {
        mergeRequestConfiguration(target, propertyKey!, { cookies: { valueOrKey: valueOrPropertyKey as string } });
      }
    }
  } else {

    //function RcpCookie(value: rcp.RequestCookies): MethodOrClassDecorator;
    if (!valueOrPropertyKey) {
      return (target: Object | Function, propertyKey?: PropertyKey, descriptor?: PropertyDescriptor) => {
        if (typeof target === 'function') {
          mergeSessionConfiguration(target, { cookies: valueOrKey as rcp.RequestCookies });
        } else {
          mergeRequestConfiguration(target, propertyKey!, { cookies: valueOrKey as rcp.RequestCookies });
        }
      }
    } else {
      //function RcpCookies(target: Object, propertyKey: PropertyKey, parameterIndex: number): void
      addParam(valueOrKey, valueOrPropertyKey, { index: parameterIndex ?? 0, type: 'Cookie', key: '' });
    }


  }
}