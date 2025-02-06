import { rcp } from "@kit.RemoteCommunicationKit";
import { mergeSessionConfiguration } from "./SessionConfiguration";
import { MethodOrClassDecorator, PropertyKey } from "./common";
import { RcpParam } from "./Params";
import { mergeRequestConfiguration, RequestConfig } from "./RequestConfiguration";

/**
 * 配置SessionConfiguration-headers
 *
 * 方法会覆盖RcpClient或Header设置的值
 * @param headers
 * @returns
 */

export function RcpHeader(headers: rcp.RequestHeaders): MethodOrClassDecorator

export function RcpHeader(key: string, value: string | string[]): MethodOrClassDecorator

export function RcpHeader(key: string): ParameterDecorator

export function RcpHeader(keyOrHeaders: string | rcp.RequestHeaders,
  value?: string | string[]): MethodOrClassDecorator | ParameterDecorator {

  if (typeof keyOrHeaders === 'string') {
    //形参装饰器
    if (!value) {
      return RcpParam('Header', keyOrHeaders);
    } else {
      //方法|类装饰器
      return (target: Function | Object, propertyKey?: PropertyKey, descriptor?: PropertyDescriptor) => {
        //function RcpHeader(key: string, value: string | string[]): ClassDecorator
        if (typeof target === 'function') {
          mergeSessionConfiguration(target, { headers: { keyOrHeaders: value } });
        } else {
          //function RcpHeader(key: string, value: string | string[]): MethodDecorator
          mergeRequestConfiguration(target, propertyKey!, { headers: { keyOrHeaders: value } });
        }
      }
    }
  } else {
    return (target: Function | Object, propertyKey?: PropertyKey, descriptor?: PropertyDescriptor) => {
      //function RcpHeader(header: rcp.RequestHeaders): ClassDecorator
      if (typeof target === 'function') {
        mergeSessionConfiguration(target, { headers: keyOrHeaders });
      } else {
        //function RcpHeader(header: rcp.RequestHeaders): MethodDecorator
        mergeRequestConfiguration(target, propertyKey!, { headers: keyOrHeaders });

      }
    }
  }

}


// function setHeaderValue(target: Record<string, string | string[] | undefined>, key: string,
//   value: string | string[] | undefined) {
//   if (value === undefined) {
//     return;
//   }
//
//   let temp = target[key];
//   if (temp === undefined) {
//     target[key] = value;
//     return;
//   }
//
//   if (typeof temp === 'string') {
//     if (temp !== value && value.indexOf(temp) < 0) {
//       target[key] = [temp].concat(Array.isArray(value) ? value : [value]);
//     }
//     return;
//   }
//
//   let set = new Set<string>(temp.concat(Array.isArray(value) ? value : [value]));
//   target[key] = Array.from(set);
// }
//

