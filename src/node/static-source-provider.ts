export type StaticSourceProvider<T> = () => Promise<T>|T;
