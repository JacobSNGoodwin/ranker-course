type DeepReadonly<T> = T extends (...a: unknown[]) => unknown
  ? T
  : {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    };
