import {StateService} from 'gs-tools/export/state';

import {source} from './source';

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