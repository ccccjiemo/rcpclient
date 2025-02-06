import { rcp } from "@kit.RemoteCommunicationKit";

declare namespace RcpClient {
  /**
   * RcpClient装饰器，保存session配置到类原型链上，并创建出单例session
   *
   * 此装饰器还会将类的所有未设置request类型装饰器转化为request请求
   * @param config
   * @returns
   */
  export function Client(config: rcp.SessionConfiguration): ClassDecorator

  /**
   * 此装饰器还会将类的所有未设置request类型装饰器转化为request请求
   * @param target
   */
  export function Client(target: Function): void


  /**
   * 类方法装饰器方法类型为 (context: rcp.RequestContext, next: rcp.RequestHandler): Promise<rcp.Response>
   *
   * 无参方法装饰器，默认向尾部插入
   * @param target
   * @param propertyKey
   * @param descriptor
   */
  export function Interceptor(target: Object, propertyKey: PropertyKey,
    descriptor: TypedPropertyDescriptor<(context: rcp.RequestContext,
      next: rcp.RequestHandler) => Promise<rcp.Response>>): void

  /**
   * 方法装饰器方法类型为 (context: rcp.RequestContext, next: rcp.RequestHandler): Promise<rcp.Response>
   *
   * 插入指定位置
   * @param index
   * @returns
   */
  export function Interceptor(index: number): MethodDecorator

  /**
   * 类装饰器，输入拦截器
   *
   * eg. \@rcp.Interceptor(new Interceptor1(), new Interceptor2()) class ApiClient {}
   * @param args
   * @returns
   */
  export function Interceptor(...args: rcp.Interceptor[]): ClassDecorator


  // export function Content(target: Object, propertyKey: PropertyKey, descriptor: TypedPropertyDescriptor<any>): void
  //
  // export function Query(target: Object, propertyKey: PropertyKey, descriptor: TypedPropertyDescriptor<string>): void
  //
  // export function Query(target: Object, propertyKey: PropertyKey, descriptor: TypedPropertyDescriptor<string>): void


  export type RequestDecorator = {
    /**
     * @param path request path
     * @param configuration 覆盖session的configuration设置
     * @returns Request装饰器
     */
    (path: string, configuration?: rcp.Configuration): (target: Object, propertyKey: PropertyKey,
      descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>) => void
    (target: Object, propertyKey: PropertyKey,
      descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>): void
  }

  export const Get: RequestDecorator

  export const Post: RequestDecorator

  export const Put: RequestDecorator

  export const Options: RequestDecorator

  export const Patch: RequestDecorator

  export const Delete: RequestDecorator

  /**
   * 这个装饰器会阻止Client装饰器将普通方法转换成Request方法,和Request类型装饰器混用,会阻止Request装饰器
   * @param target
   * @param propertyKey
   * @param descriptor
   */
  export function NoRequest(target: Object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): void;


  // export function Instance<T>(constructor: { new(...args: any[]): T }): T
  export interface RequestCancelToken {
    request?: rcp.Request
    isCancel?: boolean
  }

  /**
   * 关闭session
   * @param target
   */
  export function Close(target: Function | Object): void

  /**
   * 取消请求
   * @param token
   */
  export function Cancel(token: RequestCancelToken): void

  /**
   * 通过Object设置headers，作为类装饰器会合并到session的headers，方法装饰器会合并request的headers
   * @param headers
   * @returns
   */
  export function Headers(headers: rcp.RequestHeaders): MethodDecorator & ClassDecorator

  /**
   * 通过key value设置headers，作为类装饰器会合并到session的headers，方法装饰器会合并request的headers
   * @param key
   * @param value
   * @returns
   */
  export function Headers(key: string, value: string | string[]): MethodDecorator & ClassDecorator

  /**
   * 通过形参动态设置headers
   * @param key
   * @returns
   */
  export function Headers(key: string): ParameterDecorator

  /**
   * 通过Object设置cookies，作为类装饰器会合并到session的cookies，方法装饰器会合并request的cookies
   * @param value
   * @returns
   */
  export function Cookies(value: rcp.RequestCookies): MethodDecorator & ClassDecorator;

  /**
   * 通过key value设置headers，作为类装饰器会合并到session的cookies，方法装饰器会合并request的cookies
   * @param key
   * @param value
   * @returns
   */
  export function Cookies(key: string, value: string): MethodDecorator & ClassDecorator;

  /**
   * 通过形参动态设置cookies
   * @param target
   * @param propertyKey
   * @param parameterIndex
   */
  export function Cookies(target: Object, propertyKey: PropertyKey, parameterIndex: number): void

  /**
   * 形参装饰器
   *
   * Request请求数据(rcp.RequestContent)
   *
   * eg. getUser(@Content id: number)
   * @param target
   * @param propertyKey
   * @param parameterIndex
   */
  export function Content(target: Object, propertyKey: PropertyKey, parameterIndex: number): void

  /**
   * 形参装饰器
   *
   * 给url添加query
   *
   * eg. @Get('/api/user') getUser(@Query('key') value: number) ===> /api/user?key={value}
   * @param key
   * @returns
   */
  export function Query(key: string): ParameterDecorator

  /**
   * Request TransferRange 输入可以是官方的rcp.TransferRange | rcp.TransferRange[]
   *
   * 使用string表示 '0-100', '0-100, 200-300', '100'//表示(0-100)
   *
   * 使用number表示 100//表示(0-100)
   * @param target
   * @param propertyKey
   * @param parameterIndex
   */
  export function TransferRange(target: Object, propertyKey: PropertyKey, parameterIndex: number): void

  export type MapFunc<T> = (response: rcp.Response, instance?: Object) => Promise<T>

  export type RequestFunc<T> = (...args: any[]) => Promise<T>

  /**
   * 方法装饰器
   *
   * 将Request请求的Response，映射成需要的数据
   *
   * eg function mapString(response: rcp.Response): Promise<string> { decoder.decodeToString(response.body) }
   *
   * \@Map(mapString) getString(): Promise<string>
   * @param mapFunc
   * @returns
   */
  export function Map<T>(mapFunc: MapFunc<T>): (target: Object, propertyKey: PropertyKey,
    descriptor: TypedPropertyDescriptor<RequestFunc<T | null>>) => void;

  /**
   * 将响应数据反序列化
   * @param target
   * @param propertyKey
   * @param descriptor
   */
  export function toJson(target: Object, propertyKey: PropertyKey,
    descriptor: TypedPropertyDescriptor<RequestFunc<Object | null>>): void

  /**
   * 将响应数据转换为字符串
   * @param target
   * @param propertyKey
   * @param descriptor
   */
  export function toString(target: Object, propertyKey: PropertyKey,
    descriptor: TypedPropertyDescriptor<RequestFunc<string | null>>): void

  /**
   * 将响应数据序列化为T
   * @param target
   * @param propertyKey
   * @param descriptor
   */
  export function toMap<T extends Object>(target: Object, propertyKey: PropertyKey,
    descriptor: TypedPropertyDescriptor<RequestFunc<T | null>>): void

  /**
   * Request重试次数
   * @param target
   * @param propertyKey
   * @param descriptor
   */
  export function Retry(times: number): MethodDecorator;


  /**
   * request cancel令牌
   * @param target
   * @param propertyKey
   * @param parameterIndex
   */
  export function CancelToken(target: Object, propertyKey: PropertyKey, parameterIndex: number): void;

  /**
   * 响应内容下载到文件
   * @param value 查询实例的属性
   * @returns
   */
  export function DownLoadToFile(value: string): MethodDecorator;

  /**
   * 响应内容下载到文件
   * @param value 全局rcp.DownloadToFile
   * @returns
   */
  export function DownLoadToFile(value: rcp.DownloadToFile): MethodDecorator;


  /**
   * 响应内容发送到stream
   * @param value 查询实例的属性
   * @returns
   */
  export function DownloadToStream(value: string): MethodDecorator;

  /**
   * 响应内容发送到stream
   * @param value 全局rcp.DownloadToStream
   * @returns
   */
  export function DownloadToStream(value: rcp.DownloadToStream): MethodDecorator;

  /**
   * 响应内容发通过回调函数处理
   * @param value 查询实例的属性
   * @returns
   */
  export function ResponseDataCallback(value: string): MethodDecorator;

  /**
   * 响应内容发通过回调函数处理
   * @param value 全局回调函数
   * @returns
   */
  export function ResponseDataCallback(value: rcp.IncomingDataCallback): MethodDecorator;

  /**
   * 响应内容发通过队列处理
   * @param value 查询实例的属性
   * @returns
   */
  export function NetworkOutputQueue(value: string): MethodDecorator

  /**
   * 响应内容发通过队列处理
   * @param value 全局INetworkOutputQueue
   * @returns
   */
  export function NetworkOutputQueue(value: rcp.INetworkOutputQueue): MethodDecorator

}

