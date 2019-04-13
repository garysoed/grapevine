import { Subject } from 'rxjs';

export type Factory<T> = () => Subject<T>;
