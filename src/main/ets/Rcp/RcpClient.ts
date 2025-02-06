import { getPropertyDescriptor, getTarget, NOT_REQUEST, REQUEST_METADATA_KEY } from "./common";
import { rcp } from "@kit.RemoteCommunicationKit";
import { SetRequest } from "./Request";
import { mergeSessionConfiguration } from "./SessionConfiguration";

interface MatchResult {
  method: string;
  request: string;
}

function matchMethod(method: string): MatchResult {
  const regex = /^(GET|POST|HEAD|PUT|DELETE|PATCH|OPTIONS)\s*(.*)$/i;
  const match = method.match(regex);
  return {
    method: match ? match[1].toUpperCase() : 'GET',
    request: (match ? match[2] : method).toLowerCase()
  };
}

/**
 * 通过方法名转换为http方法
 * getUser => get /user
 * @param target
 */
function setDefaultMethod(target: Function) {
  let methods = Object.getOwnPropertyNames(target.prototype).filter(method => method !== 'constructor');
  methods.forEach(method => {
    if (!Reflect.hasMetadata(NOT_REQUEST, getTarget(target), method)) {
      const descriptor = getPropertyDescriptor(target.prototype, method);
      if (descriptor) {
        const uri = matchMethod(method);
        SetRequest(target.prototype, method, descriptor, uri.method, uri.request);
      }
    }
  })
}

/**
 * RcpClient装饰器，保存session配置到类原型链上，并创建出单例session
 *
 * 此装饰器还会将类的所有未设置request类型装饰器转化为request请求
 * @param config
 * @returns
 */
export function RcpClient(config: rcp.SessionConfiguration): ClassDecorator

/**
 * 此装饰器还会将类的所有未设置request类型装饰器转化为request请求
 * @param target
 */
export function RcpClient(target: Function): void

export function RcpClient(configOrTarget: rcp.SessionConfiguration | Function): void | ClassDecorator {
  if (typeof configOrTarget === 'function') {
    setDefaultMethod(configOrTarget);
  } else {
    return (target: Function) => {
      setDefaultMethod(target);
      mergeSessionConfiguration(target, configOrTarget);
    }
  }
}



