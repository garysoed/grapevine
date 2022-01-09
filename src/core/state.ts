import {StateService} from 'gs-tools/export/state';

import {source} from './source';


export const $stateService = source(() => new StateService());
