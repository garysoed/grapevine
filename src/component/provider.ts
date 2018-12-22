import { Observable } from 'rxjs';

export type Provider<V, T = void> = (this: T, ...args: any[]) => Observable<V>;
export type Provider0<V, T> = (this: T) => Observable<V>;
export type Provider1<V, T, P0> = (this: T, arg0: Observable<P0>) => Observable<V>;
export type Provider2<V, T, P0, P1> =
    (this: T, arg0: Observable<P0>, arg1: Observable<P1>) => Observable<V>;
export type Provider3<V, T, P0, P1, P2> =
    (this: T, arg0: Observable<P0>, arg1: Observable<P1>, arg2: Observable<P2>) => Observable<V>;
