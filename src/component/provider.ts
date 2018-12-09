import { Observable } from 'rxjs';

export type Provider<V, T = void> = (this: T, ...args: any[]) => (V|Observable<V>);
export type Provider0<V, T> = (this: T) => (V|Observable<V>);
export type Provider1<V, T, P0> = (this: T, arg0: P0) => (V|Observable<V>);
export type Provider2<V, T, P0, P1> = (this: T, arg0: P0, arg1: P1) => (V|Observable<V>);
export type Provider3<V, T, P0, P1, P2> =
    (this: T, arg0: P0, arg1: P1, arg2: P2) => (V|Observable<V>);
