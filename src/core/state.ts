import {MutableState, ObjectPath, PathProvider, RootStateId, StateService} from 'gs-tools/export/state';

import {Source, source} from './source';
import {Vine} from './vine';


export const $stateService = source(() => new StateService());

export function rootStateIdSource<T>(provider: (vine: Vine) => T): Source<RootStateId<T>> {
  return source(vine => $stateService.get(vine).addRoot(provider(vine)));
}

export function immutablePathSource<T>(rootStateId: Source<RootStateId<T>>): Source<ObjectPath<T>>;
export function immutablePathSource<R, T>(rootStateId: Source<RootStateId<R>>, provider: PathProvider<R, T>): Source<ObjectPath<T>>;
export function immutablePathSource(
    rootStateId: Source<RootStateId<unknown>>,
    provider?: PathProvider<unknown, unknown>,
): Source<ObjectPath<unknown>> {
  return source(vine => {
    const service = $stateService.get(vine);

    if (provider) {
      return service.immutablePath(rootStateId.get(vine), provider);
    } else {
      return service.immutablePath(rootStateId.get(vine));
    }
  });
}


export function mutablePathSource<T>(rootStateId: Source<RootStateId<MutableState<T>>>): Source<ObjectPath<MutableState<T>>>;
export function mutablePathSource<R, T>(rootStateId: Source<RootStateId<R>>, provider: PathProvider<R, MutableState<T>>): Source<ObjectPath<MutableState<T>>>;
export function mutablePathSource(
    rootStateId: Source<RootStateId<unknown>|RootStateId<MutableState<unknown>>>,
    provider?: PathProvider<unknown, MutableState<unknown>>,
): Source<ObjectPath<unknown>> {
  return source(vine => {
    const service = $stateService.get(vine);

    if (provider) {
      return service.mutablePath(rootStateId.get(vine), provider);
    } else {
      return service.mutablePath((rootStateId as Source<RootStateId<MutableState<unknown>>>).get(vine));
    }
  });
}