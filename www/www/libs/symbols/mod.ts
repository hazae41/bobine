export type symbolref = externref

export namespace symbols {

  // @ts-ignore
  @external("symbols", "create")
  export declare function create(): symbolref

}