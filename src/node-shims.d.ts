// Minimal ambient Node declarations for Astro's repository-wide type check.
// The project runs Node scripts with tsx; CI environments may not be able to
// install @types/node, so these declarations cover only the APIs used here.
declare const process: {
  argv: string[];
  exit(code?: number): never;
};

declare const __dirname: string;

declare class Buffer extends Uint8Array {
  static from(data: ArrayBuffer | ArrayBufferView | string): Buffer;
}

declare module 'node:fs' {
  export function readFileSync(path: string, encoding?: BufferEncoding): string;
  export function writeFileSync(path: string, data: string | Uint8Array, options?: BufferEncoding | unknown): void;
  export function mkdirSync(path: string, options?: unknown): void;
  export function rmSync(path: string, options?: unknown): void;
  export function readdirSync(path: string): string[];
  export function existsSync(path: string): boolean;
  export function appendFileSync(path: string, data: string, options?: BufferEncoding | unknown): void;
}

declare module 'node:path' {
  export function dirname(path: string): string;
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string;
}

type BufferEncoding = 'utf8' | 'utf-8' | 'ascii' | 'base64' | 'hex' | string;
