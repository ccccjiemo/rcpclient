import { rcp } from '@kit.RemoteCommunicationKit';
import {
  concatToArrayOrString,
  getTarget,
  getThis,
  INTERCEPTOR_STORE_THIS,
  NOT_REQUEST,
  PropertyKey,
  RequestDecorator,
  shallowCopy
} from './common';
import 'reflect-metadata'
import { ParamType } from './Params';
import { getSession, setSession } from './Session';
import { getSessionConfiguration } from './SessionConfiguration';
import { getRequestConfiguration, mergeRequestConfiguration, RequestConfig } from './RequestConfiguration';
import { RcpCancelToken } from './RcpCancelToken';
import { ArrayList, HashMap, url, } from '@kit.ArkTS';
import { BusinessError } from '@kit.BasicServicesKit';
import { getResponseBodyDestination } from './RcpResponseBody';


interface ParamSet {
  index: number;
  type: ParamType;
  key: string;
}

interface QueryKV {
  key: string,
  value: string
}

export function Request(method: rcp.HttpMethod, path?: string): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor): void => SetRequest(target, propertyKey, descriptor,
    method, path);
}


/**
 * Request装饰器创建工厂
 * @param target
 * @param propertyKey
 * @param descriptor
 * @param method
 * @param path
 */
export function SetRequest(target: Object, propertyKey: PropertyKey, descriptor: PropertyDescriptor,
  method: rcp.HttpMethod, path?: string, configuration?: rcp.Configuration) {
  const requestConfig: RequestConfig = { method: method, path: path ?? '', configuration: configuration }
  mergeRequestConfiguration(target, propertyKey, requestConfig);

  Reflect.defineMetadata(NOT_REQUEST, '', getTarget(target), propertyKey);

  descriptor.value = async function (this: any, ...args: ESObject[]) {
    const that = this;
    //获取session配置
    const sessionConfiguration = getSessionConfiguration(target);
    //获取request配置
    const config = getRequestConfiguration(target, propertyKey);

    //处理request路径
    let path = combinePathname(sessionConfiguration.baseAddress, config.path);

    //拷贝请求头
    const headers = shallowCopy(config.headers ?? {});
    //拷贝cookies
    const cookies = shallowCopy(config.cookies ?? {});
    //声明发送的数据
    let content: rcp.RequestContent | undefined;
    //是否自动关闭session
    const autoClose = config.autoClose ?? false;
    //创建取消口令
    let token: RcpCancelToken = {};
    //retry次数
    let retry = config.retry ?? 0;
    //响应数据映射方法
    const mapFunc = config.map;
    //获取response响应方式，默认arraybuffer
    const response = getResponseBodyDestination(that, config.response);

    //获取所有形参装饰器
    const params = config.params ?? [];
    //声明数组保存所有query
    const querys: QueryKV[] = [];
    //声明transferRange
    let transferRange: rcp.TransferRange | rcp.TransferRange[] | undefined = undefined;

    //处理所有param装饰器
    for (const param of params) {
      switch (param.type) {
        case 'Query':
          querys.push({ key: param.key, value: `${args[param.index]}` });
          break;
        case 'Content':
          content = args[param.index];
          break;
        case 'Header':
          headers[param.key] = concatToArrayOrString(headers[param.key], args[param.index]);
          break;
        case 'Cookie':
          cookies[param.key] = `${args[param.index]}`;
          break;
        case 'CancelToken':
          let t: RcpCancelToken = args[param.index];
          if (typeof t === 'object') {
            token = t;
          }
          break;
        case 'TransferRange':
          const range = args[param.index];
          transferRange = parseTransferRange(range);
          break;
      }
    }

    //合并query
    path = mergeParams(path, querys);


    let session: rcp.Session;
    let request: rcp.Request;


    //获取session
    session = getSession(target)!;
    if (!session) {
      session = rcp.createSession(sessionConfiguration);
      if (!session) {
        throw Error('create session failed');
      }
      if (!autoClose) {
        setSession(target, session);
      }
    }
    //创建request
    request =
      new rcp.Request(path, config.method?.toUpperCase() ?? 'GET', headers, content, cookies, transferRange,
        config.configuration);

    request.destination = response;

    //将上下文保存在request对象中
    setThisOnRequest(request, that);


    //设置token
    token.request = request;
    token.isCancel = false;
    token.session = session;

    //缓存request，close session时取消所有request
    pushRequest(session, request);

    let err: BusinessError;

    do {
      try {
        let responseResult = await session.fetch(request!);
        return mapFunc ? await mapFunc(responseResult, this) : response;
      } catch (e) {
        console.debug(e);
        err = e;
      } finally {
        if (retry <= 0) {
          //执行完成，移除request
          removeRequest(session, request);
          removeThisOnRequest(request);
          if (autoClose && session) {
            session.close();
          }
        }

      }
      retry--;
    } while (retry > 0 && !token.isCancel)

    //抛出错误
    throw new OHError(err)
  }

}

export function getThisOnRequest(request: rcp.Request): Object {
  const prototype = Object.getPrototypeOf(request);
  const map: HashMap<string, Object> =
    Reflect.getMetadata(INTERCEPTOR_STORE_THIS, prototype) ?? new HashMap<string, Object>();
  return map.get(request.id);
}

function setThisOnRequest(request: rcp.Request, that: Object) {
  const prototype = Object.getPrototypeOf(request);
  const map: HashMap<string, Object> =
    Reflect.getMetadata(INTERCEPTOR_STORE_THIS, prototype) ?? new HashMap<string, Object>();
  map.set(request.id, that);
  Reflect.defineMetadata(INTERCEPTOR_STORE_THIS, map, prototype);
}

function removeThisOnRequest(request: rcp.Request) {
  const prototype = Object.getPrototypeOf(request);
  const map: HashMap<string, Object> =
    Reflect.getMetadata(INTERCEPTOR_STORE_THIS, prototype) ?? new HashMap<string, Object>();
  map.remove(request.id);
  Reflect.defineMetadata(INTERCEPTOR_STORE_THIS, map, prototype);
}

export function RcpNoRequest(target: Object, propertyKey: PropertyKey, descriptor: PropertyDescriptor) {
  Reflect.defineMetadata(NOT_REQUEST, '', getTarget(target), propertyKey);
}

export function RcpCancel(token: RcpCancelToken) {
  if (!token.isCancel && token.session && token.request) {
    token.session.cancel(token.request);
    token.isCancel = true;
  }
}

function convertToCookies(input: ESObject): rcp.RequestCookies {
  if (typeof input === 'string') {
    const cookies: rcp.RequestCookies = {};
    const cookiePairs = input.split(';');
    for (const pair of cookiePairs) {
      const kv: string[] = pair.trim().split('=');
      cookies[kv[0]??""] = kv[1] ?? "";
    }
    return cookies;
  } else if (typeof input === 'object' && input !== null) {
    const cookies: rcp.RequestCookies = {};
    let keys = Object.keys(input);
    for (const key of keys) {
      cookies[key] = input[key].toString()
    }
    return cookies;
  } else {
    return {};
  }
}


export function createRequestDecorator(method: rcp.HttpMethod): RequestDecorator {
  let decoratorFactory: (path: string, configuration?: rcp.Configuration) => MethodDecorator =
    (path: string, configuration?: rcp.Configuration): MethodDecorator => {
      return (target, propertyKey, descriptor) => {
        SetRequest(target, propertyKey, descriptor, method.toUpperCase(), path, configuration);
      }
    };

  let directDecorator: (target: Object, propertyKey: PropertyKey, descriptor: PropertyDescriptor) => void =
    (target: Object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): void => {
      SetRequest(target, propertyKey, descriptor, method);
    };

  return (arg1: Object | string, arg2?: PropertyKey | rcp.Configuration, arg3?: PropertyDescriptor): ESObject => {
    if (typeof arg1 === 'string') {
      return decoratorFactory(arg1);
    } else {
      directDecorator(arg1, arg2 as PropertyKey, arg3!);
    }
  }

}

export function createNotRequest(target: Object, propertyKey: PropertyKey, descriptor: PropertyDescriptor) {

}


const RequestCache: HashMap<rcp.Session, ArrayList<rcp.Request>> = new HashMap();

function pushRequest(session: rcp.Session, request: rcp.Request) {
  if (!RequestCache.hasKey(session)) {
    let list = new ArrayList<rcp.Request>();
    list.add(request);
    RequestCache.set(session, list);
    return;
  } else {
    RequestCache.get(session).add(request);
  }
}

function removeRequest(session: rcp.Session, request: rcp.Request) {
  if (!RequestCache.hasKey(session)) {
    return;
  }
  RequestCache.get(session).remove(request);
}

class OHError implements BusinessError {
  code: number;
  data?: void | undefined;
  name: string;
  message: string;
  stack?: string | undefined;

  constructor(err: BusinessError) {
    this.code = err.code;
    this.data = err.data;
    this.name = err.name;
    this.message = err.message;
    this.stack = err.stack;
  }
}

function mergeParams(originalUrl: string, querys: QueryKV[]) {
  // 分解原始URL为路径和查询字符串部分
  const sp = originalUrl.split('?');
  const path = sp[0];
  const query = sp[1];

  // 解析现有的查询参数
  if (query) {
    const pairs = query.split('&');
    for (const pair of pairs) {
      const kv = pair.split('=');
      querys.push({ key: kv[0], value: kv[1] })
    }
  }

  const mergeArray: string[] = querys.map((kv: QueryKV) => {
    return `${kv.key}=${kv.value}`
  });

  return `${path}${mergeArray.length > 0 ? '?' : ''}${mergeArray.join('&')}`

}

// function parseTransferRange(value: any): undefined | rcp.TransferRange | rcp.TransferRange[] {
//   if (typeof value === 'string') {
//     //value是使用string表示 '0-100', '0-100, 200-300', '100'//表示(0-100),
//     const result: rcp.TransferRange[] = [];
//     const ranges = value.split(/[,，]/);
//     for (let i = 0; i < ranges.length; i++) {
//       const range = ranges[i].trim();
//       //空字符串
//       if (!range) {
//         continue;
//       }
//       const se = range.split('-');
//       result.push({
//         from: se.length == 1 ? 0 : parseInt(se[0]),
//         to: se.length == 1 ? parseInt(se[0]) : parseInt(se[1])
//       });
//     }
//     return !result.length ? undefined : result.length == 1 ? result[0] : result;
//   } else if (typeof value === 'number') {
//     //value是使用number表示 100//(0-100)
//     return { from: 0, to: value };
//   }
//   return value;
// }

function parseTransferRange(value: any): undefined | rcp.TransferRange | rcp.TransferRange[] {
  if (typeof value === 'string') {
    const result: rcp.TransferRange[] = [];

    // 处理中英文逗号分割，并过滤空字符串
    const ranges = value.split(/[,，]/).map(r => r.trim()).filter(Boolean);

    for (const range of ranges) {
      const parts = range.split('-');

      // 验证分割后的分段数量
      if (parts.length !== 1 && parts.length !== 2) {
        continue;
      }

      // 解析数字（显式指定十进制）
      const [fromStr, toStr] = parts.length === 1 ? ['0', parts[0]] : [parts[0], parts[1]];
      const from = parseInt(fromStr, 10);
      const to = parseInt(toStr, 10);

      // 验证数字有效性
      if (isNaN(from) || isNaN(to)) {
        continue;
      }

      // 确保 from <= to
      const [validFrom, validTo] = from <= to ? [from, to] : [to, from];

      result.push({
        from: validFrom,
        to: validTo
      });
    }

    // 返回结果格式化
    return result.length === 0
      ? undefined
      : result.length === 1
        ? result[0]
        : result;
  }

  if (typeof value === 'number') {
    // 处理数值边界情况
    return isNaN(value) || !isFinite(value)
      ? undefined
      : { from: 0, to: value };
  }

  return value;
}

function mergeUrls(baseUrl?: rcp.URLOrString, relativePath?: string) {
  // 解析基础URL的路径
  const base = baseUrl instanceof url.URL ? baseUrl : url.URL.parseURL(baseUrl ?? '');
  const basePath = base.pathname;

  // 判断路径是否以斜杠结尾
  const endsWithSlash = basePath.endsWith('/');

  if (relativePath === undefined) {
    // 当相对路径为undefined时的处理
    if (endsWithSlash) {
      return '/';
    } else {
      // 获取最后一个非空路径段
      const parts = basePath.split('/').filter(part => part !== '');
      const lastPart = parts.length > 0 ? parts[parts.length - 1] : '';
      return `/${lastPart}`;
    }
  } else {
    // 处理相对路径的前导斜杠
    const relative = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;

    if (endsWithSlash) {
      // 基础路径以斜杠结尾，直接拼接相对路径
      return `/${relative}`;
    } else {
      // 获取基础路径的最后一段并拼接
      const parts = basePath.split('/').filter(part => part !== '');
      const lastPart = parts.length > 0 ? parts[parts.length - 1] : '';
      return `/${lastPart}/${relative}`;
    }
  }
}

function combinePathname(param1?: rcp.URLOrString, param2?: string): string {
  let basePathname = '';

  if (param1 === undefined) {
    return param2 ?? '';
  }

  // 处理 param1
  if (param1 instanceof url.URL) {
    basePathname = param1.pathname;
  } else if (typeof param1 === 'string') {
    try {
      const url1 = url.URL.parseURL(param1);
      basePathname = url1.pathname;
    } catch (error) {
      // 如果 param1 不是有效的 URL，则将其作为普通字符串处理
      basePathname = param1;
    }
  }

  // 处理 param2
  if (typeof param2 === 'string') {
    // 去除 basePathname 末尾的斜杠
    basePathname = basePathname.replace(/\/+$/, '');
    // 去除 param2 开头的斜杠
    param2 = param2.replace(/^\/+/, '');
    // 组合路径
    if (basePathname && param2) {
      basePathname += '/' + param2;
    } else {
      basePathname += param2;
    }
  }

  // 确保结果以斜杠开头
  if (!basePathname.startsWith('/')) {
    basePathname = '/' + basePathname;
  }
  return basePathname;
}
