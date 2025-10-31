declare namespace __AdaptedExports {
  /** Exported memory */
  export const memory: WebAssembly.Memory;
  /**
   * erc20/f
   * @param x `f64`
   * @returns `f64`
   */
  export function f(x: number): number;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
}): Promise<typeof __AdaptedExports>;
