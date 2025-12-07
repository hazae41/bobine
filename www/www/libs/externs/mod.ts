export namespace refs {

  // @ts-ignore
  @external("refs", "numerize")
  export declare function numerize(ref: externref): usize

  // @ts-ignore
  @external("refs", "denumerize")
  export declare function denumerize(index: usize): externref

}