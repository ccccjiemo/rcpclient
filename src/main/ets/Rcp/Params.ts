import { PropertyKey } from './common';
import { mergeRequestConfiguration } from './RequestConfiguration';

export type ParamType = 'Content' | 'Header' | 'Query' | 'Cookie' | 'CancelToken' | 'TransferRange';

export interface ParamSet {
  index: number;
  type: ParamType;
  key: string;
}

export function RcpParam(type: ParamType, name: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    // const params: ParamSet[] = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || [];
    // params.push({
    //   index: parameterIndex,
    //   type: type,
    //   key: name
    // })
    // Reflect.defineMetadata(PARAM_METADATA_KEY, params, target, propertyKey);

    addParam(target, propertyKey, {
      index: parameterIndex,
      type: type,
      key: name
    })
  }
}

export function addParam(target: Object, propertyKey: PropertyKey, param: ParamSet) {
  // const params: ParamSet[] = Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || [];
  // params.push(param);
  // Reflect.defineMetadata(PARAM_METADATA_KEY, params, target, propertyKey);
  mergeRequestConfiguration(target, propertyKey, { params: [param] })
}
