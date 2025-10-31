export async function instantiate(module, imports = {}) {
  const __module0 = imports["0xE1397f777BE7F246F04424b3EbadA68a5189cdb5"];
  const adaptedImports = {
    "0xE1397f777BE7F246F04424b3EbadA68a5189cdb5": Object.setPrototypeOf({
      transfer(target, amount) {
        // main/token_transfer(~lib/string/String, f64) => void
        target = __liftString(target >>> 0);
        __module0.transfer(target, amount);
      },
    }, __module0),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  return exports;
}
