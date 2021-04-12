import {source} from './source';
import {StateService} from 'gs-tools/export/state';

export const $stateService = source('stateService', () => new StateService());

export const $resolveState = source('resolveState', vine => $stateService.get(vine).resolve);
export const $modifyState = source('modifyState', vine => $stateService.get(vine).modify);
export const $modifyStateOp = source('modifyStateOp', vine => $stateService.get(vine).modifyOperator);