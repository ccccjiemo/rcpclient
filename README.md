# @jemoc/RcpClient

---

## 如何安装

```shell
ohpm install @jemoc/RcpClient
```

## 如何使用

### 快速使用rcp请求

Client装饰器会将所有方法通过方法名(请求方法 + 请求路径)转换为相应的Request请求,并通过支持的装饰器动态修改请求设置

Session实例会保存在类原型上，复用Session，通过Close关闭Session对象;

```typescript
import { RcpClient } from '@jemoc/RcpClient'

@RcpClient.Client({ baseAddress: "http://127.0.0.1/api" })
class UserApi {
  //get http://127.0.0.1/api/user
  async getUser(@RcpClient.Query('key') key: string,
    @RcpClient.Cookies('cookie') cookie: string,
    @RcpClient.Headers('content-type') type: string,
    @RcpClient.CancelToken token: RcpClient.RequestCancelToken): Promise<rcp.Response> {
    return {} as rcp.Response;
  }

  //post http://127.0.0.1/api/user {body: content}
  async postUser(@RcpClient.Content content: string): Promise<rcp.Response> {
    return {} as rcp.Response;
  }
}

const api = new UserApi();
const token: RcpClient.RequestCancelToken = {};
api.getUser('1', 'cookies', 'application/json', token).then(res => {
  console.log(res.toString());
}).catch(err => {
})

//取消请求
RcpClient.Cancel(token);

//通过RcpClient的Close方法关闭session
RcpClient.Close(api);

```

### 通过Request装饰器实现Request请求

```typescript
class UserApi {
  //get http://127.0.0.1/api/user?key={key}
  // 该例子和快速使用中例子一致
  @RcpClient.Get('/user')
  async getUser(@RcpClient.Query('key') key: string): Promise<rcp.Response> {
    return {} as rcp.Response;
  }

  //通过设置configuration覆盖session中的configuration
  @RcpClient.Get('/user', { proxy: 'system' })
  async getUser(): Promise<rcp.Response> {
    return {} as rcp.Response;
  }
}
```

### 数据响应映射

```typescript
interface User {
name?: string;
id?: number;
}

interface ApiResult {
code: number;
message: string;
data: any;
}

//自定义映射方法
async function mapFunc(response: rcp.Response): Promise<ApiResult> {
  return {
    code: response.statusCode,
    message: 'success',
    data: response.toJson()
  }
}

class UserApi {
  //将响应数据序列化为User
  @RcpClient.toMap<User>
  async getUser(): Promise<User| null> {
    return null;
  }

  //将响应数据转换为string
  @RcpClient.toString
  async getUser(): Promise<string| null> {
    return null;
  }

  //将响应数据转换为Object
  @RcpClient.toJson
  async getUser(): Promise<Object| null> {
    return null;
  }

  //自定义数据映射
  @RcpClient.Map(mapFunc)
  async getUser(): Promise<ApiResult> {
    return {};
  }
}
```

### 拦截器装饰器的使用

```typescript
//Interceptor1、Interceptor2 为 集成自rcp.Interceptor的类
@RcpClient.Interceptor(new Interceptor1(), new Interceptor2())
class UserApi {
}

//通过Client装饰器设置拦截器
@RcpClient.Client({ interceptor: [new Interceptor1(), new Interceptor2()] })
class UserApi {
}

//通过类方法实现拦截器
class UserApi {
  //默认向session的configuration中interceptor末尾插入
  @RcpClient.Interceptor
  async interceptor1(context: rcp.RequestContext, next: rcp.RequestHandler): Promise<rcp.Response> {
    //...
  }

  //指定插入位置,因为编译的不确定性，有严格的拦截器执行顺序请用类装饰器
  @RcpClient.Interceptor(1)
  async interceptor1(context: rcp.RequestContext, next: rcp.RequestHandler): Promise<rcp.Response> {
    //...
  }
}
```

### 数据响应类型

标准返回ArrayBuffer，可以通过Response装饰器将数据返回到特定方法

Response类型装饰器包括@DownloadToStream、@DownLoadToFile、@ResponseDataCallback、@NetworkOutputQueue。Response装饰器的重载是类似的。

#### 将响应数据下载到文件

```typescript
class UserApi {
  downloadOption: rcp.DownloadToFile

  @RcpClient.DownLoadToFile({ kind: 'file', file: getContext(this).filesDir + '/test.txt' })
  async getFile(): Promise<void> {
  } //正常是返回rcp.Response,

  @RcpClient.DownLoadToFile('downloadOption')
  async getFile(): Promise<void> {
  } //正常是返回rcp.Response,
}
```

#### 通过回调函数处理

```typescript
function globalGetFileCallback(arraybuffer) {
  //...
}

class UserApi {
  getFileCallback: rcp.IncomingDataCallback

  @RcpClient.ResponseDataCallback(globalGetFileCallback)
  async getFile(): Promise<void> {
  } //正常是返回rcp.Response,

  @RcpClient.ResponseDataCallback('getFileCallback')
  async getFile(): Promise<void> {
  } //正常是返回rcp.Response,
}
```

---

### 奇怪的用法

#### 通过装饰器实现ViewModel

```typescript
@RcpClient.Client({ baseAddress: 'http://192.168.69.74:3000/api/user' })
class UserBase {
}

async function mapData(response: rcp.Response, instance: UserViewModel) {
  const userData = response.toJSON() as User;
  instance.name = userData.name ?? "";
  instance.id = userData.id ?? 0;
  return userData;
}

@Observed
class UserViewModel extends UserBase {
  name: string = '';
  id: number = 0;

  @RcpClient.Map(mapData)
  @RcpClient.Get
  //子类不在Client装饰器范围内，需要手动指定Request装饰器
  async getUser(@RcpClient.Query('id') id: number): Promise<User | null> {
    return null
  }
}
```

## 装饰器

---
<table>
<tr>
    <td rowspan="2">装饰器</td>
    <td colspan="3" align="center">类型</td>
    <td rowspan="2">描述</td>
</tr>
<tr>
    <td>类</td>
    <td>方法</td>
    <td>参数</td>
</tr>
<tr>
    <td>Client</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>&#10005</td>
    <td>支持有参或无参调用。传入rcp.SessionConfig时保存session配置到类原型链上。该装饰器还会将类的所有方法通过方法名(HttpMethod + path)转换成Request请求，可以给方法添加NoRequest装饰器，阻止某个方法转换。Request请求时自动创建session对象，关闭session需要调用RcpClient.Close或者配置AutoClose装饰器</td>
</tr>
<tr>
    <td>Interceptor</td>
    <td>&#10004</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>将拦截器保存在session配置上。装饰器是方法装饰器时，会将方法转换成拦截器</td>
</tr>
<tr>
    <td>Get</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>方法转换为get请求，装饰器支持传入pathname和configuration</td>
</tr>
<tr>
    <td>Post</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>方法转换为post请求，装饰器支持传入pathname和configuration</td>
</tr>
<tr>
    <td>Put</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>方法转换为put请求，装饰器支持传入pathname和configuration</td>
</tr>
<tr>
    <td>Options</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>方法转换为options请求，装饰器支持传入pathname和configuration</td>
</tr>
<tr>
    <td>Patch</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>方法转换为patch请求，装饰器支持传入pathname和configuration</td>
</tr>
<tr>
    <td>Delete</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>方法转换为delete请求，装饰器支持传入pathname和configuration</td>
</tr>
<tr>
    <td>NoRequest</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>阻止Client装饰器将方法转换成Request请求</td>
</tr>
<tr>
    <td>Headers</td>
    <td>&#10004</td>
    <td>&#10004</td>
    <td>&#10004</td>
    <td>装饰器是类装饰器时，接受key,value输入或者rcp.RequestHeaders对象，合并到sessionConfiguration;<br>装饰器是方法装饰器时，接受key,value输入或者rcp.RequestHeaders对象，合并到Request的Configuration;<br>作为参数装饰器时，可以动态修改request的headers值</td>
</tr>
<tr>
    <td>Cookies</td>
    <td>&#10004</td>
    <td>&#10004</td>
    <td>&#10004</td>
    <td>与Headers装饰器使用方法相同</td>
</tr>
<tr>
    <td>Content</td>
    <td>&#10005</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>指定Request的content输入，类型需要和rcp.RequestContent相同(全凭自觉)</td>
</tr>
<tr>
    <td>Query</td>
    <td>&#10005</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>动态修改请求路径的query</td>
</tr>
<tr>
    <td>CancelToken</td>
    <td>&#10005</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>输入一个RequestCancelToken,可以通过调用RcpClient.Cancel取消Request</td>
</tr>
<tr>
    <td>TransferRange</td>
    <td>&#10005</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>动态设置request的transferRange。除了支持官方的rcp.TransferRange | rcp.TransferRange[]输入外。该装饰器支持输入number或者string。<br>
    输入如果时number时，会将结果转换成 0-{number};<br>
    输入string支持格式'0-100'|'0-100,200-300'|'100'
</td>
</tr>
<tr>
    <td>Map</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>默认返回值是rcp.Response，通过自定义方法将response.body的结果转换成需要的类型</td>
</tr>
<tr>
    <td>toJson</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>将结果转换成(Object|null)返回</td>
</tr>
<tr>
    <td>toString</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>将结果转换成(string|null)返回</td>
</tr>
<tr>
    <td>toMap<\T></td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>将结果转换成(T|null)返回。实际就是toJSON后通过as返回结果。</td>
</tr>
<tr>
    <td>Retry</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>错误重试</td>
</tr>
<tr>
    <td>DownLoadToFile</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>将响应数据保存到文件，支持指定类属性或者传入一个全局rcp.DownloadToFile</td>
</tr>
<tr>
    <td>DownloadToStream</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>将响应数据通过流，支持指定类属性或者传入一个全局rcp.DownloadToStream</td>
</tr>
<tr>
    <td>ResponseDataCallback</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>将响应数据通过回调函数处理，支持指定类属性或者传入一个全局回调函数</td>
</tr>
<tr>
    <td>NetworkOutputQueue</td>
    <td>&#10005</td>
    <td>&#10004</td>
    <td>&#10005</td>
    <td>通过队列处理</td>
</tr>
</table>

## APIs

---

| 方法     | 参数                                | 描述                    |
|--------|-----------------------------------|-----------------------|
| Close  | (target: Function \| Object):void | 通过类实例或者类构造方法关闭session |
| Cancel | (token: RequestCancelToken):void  | 取消Request请求           |      
