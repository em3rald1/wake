import { some, none, Option } from "./option.ts";
import { construct_logger } from "../logger/logger.ts";

const { error: error_log } = construct_logger({ logger: console.log, colors_support: true });

export type Result<T, E> = Ok<T> | Err<E>;

export type Ok<T> = {
  is_ok(): this is Ok<T>;
  is_err(): this is Err<unknown>;
  map<U>(fn: (value: T) => U): Result<U, unknown>;
  map_err<X>(fn: (error: unknown) => X): Result<T, X>;
  expect(message: string): T;
  unwrap(): T;
  expect_err(message: string): never;
  unwrap_err(): never;
};

export type Err<E> = {
  is_ok(): this is Ok<unknown>;
  is_err(): this is Err<E>;
  map<U>(fn: (value: unknown) => U): Result<U, E>;
  map_err<X>(fn: (error: E) => X): Result<unknown, X>;
  expect(message: string): never;
  unwrap(): never;
  expect_err(message: string): E;
  unwrap_err(): E;
};

export function ok<T>(value: T): Ok<T> {
  return {
    is_ok(): this is Ok<T> { return true; },
    is_err(): this is Err<unknown> { return false; },
    map<U>(fn: (value: T) => U): Result<U, unknown> { return ok(fn(value)); },
    map_err<X>(_: (error: unknown) => X): Result<T, X> { return { ...this }; },
    expect(_: string): T { return value; },
    unwrap(): T { return value; },
    expect_err(message: string): never { 
      error_log(`Ok(${value}).expect_err: ${message}`);
      throw 'Ok.expect_err';
    },
    unwrap_err(): never {
      error_log(`Ok(${value}).unwrap_err: unexpected unwrap`);
      throw 'Ok.unwrap_err';
    }
  };
}

export function err<E>(error: E): Err<E> {
  return {
    is_ok(): this is Ok<unknown> { return false; },
    is_err(): this is Err<E> { return true; },
    map<U>(_: (value: unknown) => U): Result<U, E> { return { ...this }; },
    map_err<X>(fn: (error: E) => X): Result<unknown, X> { return err(fn(error)); },
    expect(message: string): never {
      error_log(`Err(${error}).expect: ${message}`);
      throw 'Err.expect';
    },
    unwrap(): never {
      error_log(`Err(${error}).unwrap: unexpected unwrap`);
      throw 'Err.unwrap';
    },
    expect_err(_: string): E {
      return error;
    },
    unwrap_err(): E {
      return error;
    }
  }
}
