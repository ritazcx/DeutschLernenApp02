// Minimal typed declarations for `better-sqlite3` to satisfy the TypeScript compiler
declare module 'better-sqlite3' {
  type RunResult = { changes?: number; lastInsertROWID?: number };

  interface Statement {
    run(...params: any[]): RunResult;
    all(...params: any[]): any[];
    get(...params: any[]): any;
    iterate(...params: any[]): IterableIterator<any>;
    bind(...params: any[]): Statement;
    raw(enable?: boolean): Statement;
  }

  interface DatabaseOptions {
    readonly readonly?: boolean;
    readonly fileMustExist?: boolean;
    readonly memory?: boolean;
    readonly verbose?: (msg: string) => void;
    readonly timeout?: number;
  }

  export default class Database {
    constructor(filename: string, options?: DatabaseOptions);
    prepare(sql: string): Statement;
    exec(sql: string): void;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
    close(): void;
    pragma(name: string, value?: any): any;
  }
}
