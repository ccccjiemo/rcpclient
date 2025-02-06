import { rcp } from "@kit.RemoteCommunicationKit";
import { ArrayList, HashMap } from "@kit.ArkTS";

export interface RcpCancelToken {
  session?: rcp.Session;
  request?: rcp.Request;
  isCancel?: boolean;
}


// export function RcpCancel(token: RcpCancelToken) {
//   if (!token.session || !token.request) {
//     return;
//   }
//
//   token.session
// }