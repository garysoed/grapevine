import {ObjectPath, PathProvider, RootStateId, StateService, StateService2} from 'gs-tools/export/state';

import {MutableState} from '../../../tools/src/state/state-service-2';

import {Source, source} from './source';

export const $stateService = source('stateService', () => new StateService());

export const $resolveState = source('resolveState', vine => {
  const stateService = $stateService.get(vine);
  return stateService.resolve.bind(stateService);
});
export const $resolveStateOp = source('resolveStateOp', vine => {
  const stateService = $stateService.get(vine);
  return stateService.resolveOperator.bind(stateService);
});
export const $modifyState = source('modifyState', vine => {
  const stateService = $stateService.get(vine);
  return stateService.modify.bind(stateService);
});
export const $modifyStateOp = source('modifyStateOp', vine => {
  const stateService = $stateService.get(vine);
  return stateService.modifyOperator.bind(stateService);
});

export const $stateService2 = source('stateService2', () => new StateService2());

export function mutablePathSource<T>(label: string, rootStateId: Source<RootStateId<T>>): Source<ObjectPath<T>>;
export function mutablePathSource<R, T>(label: string, rootStateId: Source<RootStateId<R>>, provider: PathProvider<R, T>): Source<ObjectPath<T>>;
export function mutablePathSource(
    label: string,
    rootStateId: Source<RootStateId<unknown>>,
    provider?: PathProvider<unknown, unknown>,
): Source<ObjectPath<unknown>> {
  return source(label, vine => {
    const service = $stateService2.get(vine);

    if (provider) {
      return service.mutablePath(rootStateId.get(vine), provider);
    } else {
      return service.mutablePath(rootStateId.get(vine) as RootStateId<MutableState<unknown>>);
    }
  });
}