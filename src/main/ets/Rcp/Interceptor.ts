import { rcp } from '@kit.RemoteCommunicationKit';
import { getSessionConfiguration, mergeSessionConfiguration, setSessionConfiguration } from './SessionConfiguration';
import { getTarget, INTERCEPTOR_STORE_THIS, NOT_REQUEST, PropertyKey } from './common';
import { getThisOnRequest } from './Request';

/**
 * Interceptor ClassDecorator
 * @param interceptors
 * @returns
 */
// export function RcpInterceptor(...args: rcp.Interceptor[]): ClassDecorator
//
// export function RcpInterceptor(index?: number): MethodDecorator
//
// export function RcpInterceptor(...args: rcp.Interceptor[] | number[]): ClassDecorator {
//   return (target: Function) => {
//     const configuration = getConfiguration(target);
//     configuration.interceptors = configuration.interceptors ?? [];
//     configuration.interceptors.push(...args);
//     setConfiguration(target, configuration);
//   };
// }

// 类装饰器实现
function applyClassInterceptor(...args: rcp.Interceptor[]): ClassDecorator {
  return (target: Function) => {
    // const configuration = getSessionConfiguration(target);
    // configuration.interceptors = configuration.interceptors ?? [];
    // configuration.interceptors.push(...args);
    // //去重
    // setSessionConfiguration(target, configuration);
    mergeSessionConfiguration(target, { interceptors: [...args] })

  };
}

// 方法装饰器实现
function applyMethodInterceptor(index?: number): MethodDecorator {
  return (target: Object, propertyKey: PropertyKey, descriptor: PropertyDescriptor) => {

    Reflect.defineMetadata(NOT_REQUEST, '', getTarget(target), propertyKey);

    const originalMethod = descriptor.value;

    const interceptor = new InnerInterceptor(originalMethod);

    //mergeSessionConfiguration(target, { interceptors: [new InnerInterceptor(originalMethod)] })

    const configuration = getSessionConfiguration(target);
    configuration.interceptors = configuration.interceptors ?? [];
    configuration.interceptors.splice(constrain(index ?? configuration.interceptors.length, 0,
      configuration.interceptors.length), 0,
      interceptor)
    setSessionConfiguration(target, configuration);
    //mergeSessionConfiguration(target, { interceptors: [new InnerInterceptor(descriptor.value)] })

    return descriptor;

  };
}

function constrain(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  } else if (value > max) {
    return max;
  } else {
    return value;
  }
}

class InnerInterceptor implements rcp.Interceptor {
  value?: (context: rcp.RequestContext, next: rcp.RequestHandler) => Promise<rcp.Response>;
  that?: any;

  constructor(value?: (context: rcp.RequestContext, next: rcp.RequestHandler) => Promise<rcp.Response>) {
    this.value = value;
  }

  async intercept(context: rcp.RequestContext, next: rcp.RequestHandler): Promise<rcp.Response> {
    const that = getThisOnRequest(context.request);
    const func = this.value;
    return await func?.apply(that, [context, next]);
  }
}

/**
 * 类方法装饰器方法类型为 (context: rcp.RequestContext, next: rcp.RequestHandler): Promise<rcp.Response>
 *
 * 插入指定位置
 * @param index
 * @returns
 */
export function RcpInterceptor(index: number): MethodDecorator

/**
 * 类装饰器，输入拦截器
 *
 * eg. \@rcp.Interceptor(new Interceptor1(), new Interceptor2()) class ApiClient {}
 * @param args
 * @returns
 */
export function RcpInterceptor(...args: rcp.Interceptor[]): ClassDecorator

/**
 * 类方法装饰器方法类型为 (context: rcp.RequestContext, next: rcp.RequestHandler): Promise<rcp.Response>
 *
 * 无参方法装饰器，默认向尾部插入
 * @param target
 * @param propertyKey
 * @param descriptor
 */
export function RcpInterceptor(target: Object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): void

export function RcpInterceptor(...args: ESObject): ClassDecorator | MethodDecorator | void {
  if (typeof args[0] === 'number') {
    return (target, propertyKey, descriptor) => {

      applyMethodInterceptor(args[0])(target, propertyKey, descriptor);
    }
  }

  if (typeof args[0].intercept === 'function') {
    return applyClassInterceptor(...args as rcp.Interceptor[]);
  }

  if (typeof args[0] === 'object' && typeof args[1] !== 'object') {
    applyMethodInterceptor()(args[0] as Object, args[1] as PropertyKey, args[2] as PropertyDescriptor);
    return;
  }


}

