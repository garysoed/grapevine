import { InstanceofType } from 'gs-types/export';
import { staticSourceId } from '../component/static-source-id';
import { VineImpl } from './vine-impl';

export const $vine = staticSourceId('vine', InstanceofType<VineImpl>(VineImpl));
