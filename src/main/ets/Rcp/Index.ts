import { RcpHeader } from './Header';
import { RcpInterceptor } from './Interceptor'
import { RcpParam } from './Params';
import { RcpClient as RCPClient } from './RcpClient'
import { createRequestDecorator, RcpCancel, RcpNoRequest, Request } from './Request';
import { createInstance } from './common';
import { CloseSession } from './Session';
import { RcpCookies } from './Cookies';
import { RcpMap, ToJson, ToMap, ToString } from './RcpMap';
import { RcpRetry } from './RcpRetry';
import { rcp } from '@kit.RemoteCommunicationKit';
import { createResponseDecorator } from './RcpResponseBody';

export namespace RcpClient {
  export const Client = RCPClient

  export const Interceptor = RcpInterceptor;

  export const Content = RcpParam('Content', '');

  export const Query = (key: string) => RcpParam('Query', key);

  export const CancelToken = RcpParam('CancelToken', '');

  export const TransferRange = RcpParam('TransferRange', '');

  export const Cookies = RcpCookies;

  export const Headers = RcpHeader;

  export const Get = createRequestDecorator('Get');

  export const Post = createRequestDecorator('Post');

  export const Put = createRequestDecorator('PUT');

  export const Head = createRequestDecorator('HEAD');

  export const Options = createRequestDecorator('OPTIONS');

  export const Delete = createRequestDecorator('DELETE');

  export const Patch = createRequestDecorator('PATCH');

  export const NoRequest = RcpNoRequest;

  export const Instance = createInstance;

  export const Close = CloseSession;

  export const Cancel = RcpCancel;

  export const Map = RcpMap;

  export const toString = ToString;

  export const toJson = ToJson;

  export const toMap = ToMap

  export const Retry = RcpRetry

  export const DownLoadToFile =
    (value: string | rcp.DownloadToFile) => createResponseDecorator('downloadtofile', value);

  export const DownloadToStream =
    (value: string | rcp.DownloadToStream) => createResponseDecorator('downloadtostream', value);

  export const ResponseDataCallback =
    (value: string | rcp.IncomingDataCallback) => createResponseDecorator('incomingdatacallback', value);

  export const NetworkOutputQueue =
    (value: string | rcp.INetworkOutputQueue) => createResponseDecorator('networkoutputqueue', value);
}

