import {MutableState, ObjectPath, PathProvider, RootStateId, StateService, StateService2} from 'gs-tools/export/state';

import {Source, source} from './source';

export const $stateService = source(() => new StateService());

export const $resolveState = source(vine => {
  const stateService = $stateService.get(vine);
  return stateService.resolve.bind(stateService);
});
export const $resolveStateOp = source(vine => {
  const stateService = $stateService.get(vine);
  return stateService.resolveOperator.bind(stateService);
});
export const $modifyState = source(vine => {
  const stateService = $stateService.get(vine);
  return stateService.modify.bind(stateService);
});
export const $modifyStateOp = source(vine => {
  const stateService = $stateService.get(vine);
  return stateService.modifyOperator.bind(stateService);
});

export const $stateService2 = source(() => new StateService2());

export function mutablePathSource<T>(rootStateId: Source<RootStateId<T>>): Source<ObjectPath<T>>;
export function mutablePathSource<R, T>(rootStateId: Source<RootStateId<R>>, provider: PathProvider<R, T>): Source<ObjectPath<T>>;
export function mutablePathSource(
    rootStateId: Source<RootStateId<unknown>>,
    provider?: PathProvider<unknown, unknown>,
): Source<ObjectPath<unknown>> {
  return source(vine => {
    const service = $stateService2.get(vine);

    if (provider) {
      return service.mutablePath(rootStateId.get(vine), provider);
    } else {
      return service.mutablePath(rootStateId.get(vine) as RootStateId<MutableState<unknown>>);
    }
  });
}