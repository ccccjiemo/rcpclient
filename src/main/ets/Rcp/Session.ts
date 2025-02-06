import 'reflect-metadata'
import { removeInstance, SESSION_METADATA_KEY } from './common'
import { rcp } from '@kit.RemoteCommunicationKit'

export function getSession(target: Object, isProto: boolean = true): rcp.Session | undefined {
  let session: rcp.Session = Reflect.getMetadata(SESSION_METADATA_KEY, isProto ? target.constructor.prototype : target);
  return session;
}

export function setSession(target: Object, session?: rcp.Session, isProto: boolean = true): void {
  Reflect.defineMetadata(SESSION_METADATA_KEY, session, isProto ? target.constructor.prototype : target);
}

export function CloseSession(target: Function | Object) {
  // const t: ESObject = removeInstance(target as ESObject);
  // if (!t) {
  //   return;
  // }
  // let prototype: Object = target.prototype;
  let session = getSession(target);
  if (session) {
    session.close();
  }
  setSession(target);
}