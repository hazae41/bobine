declare namespace __AdaptedExports {
  /** Exported memory */
  export const memory: WebAssembly.Memory;
  /**
   * main/main
   */
  export function main(): void;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
  "0xE1397f777BE7F246F04424b3EbadA68a5189cdb5": unknown,
}): Promise<typeof __AdaptedExports>;
