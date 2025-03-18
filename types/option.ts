export type Option<T> = Some<T> | None;

export type Some<T> = {
  map<U>(fn: (v: T) => U): Option<U>;
  is_some(): this is Some<T>;
  is_none(): this is None;
  unwrap(): T;
};

export type None = {
  map<U>(fn: (v: unknown) => U): Option<U>;
  is_some(): this is Some<unknown>;
  is_none(): this is None;
  unwrap(): never;
}

export function some<T>(value: T): Some<T> {
  return {
    map<U>(fn: (v: T) => U): Option<U> {
      return some<U>(fn(value));
    },
    is_some(): this is Some<T> { return true; },
    is_none(): this is None { return false; },
    unwrap(): T { return value; }
  }
}

export const none: None = {
  map<U>(_: (v: unknown) => U) {
    return none;
  },
  is_some(): this is Some<unknown> { return false; },
  is_none(): this is None { return true; },
  unwrap(): never {
    console.log('Unexpected None.unwrap()');
    throw 'None.unwrap';
  }
}
