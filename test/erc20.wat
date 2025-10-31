(module
 (type $0 (func (param i32 f64)))
 (type $1 (func))
 (import "867742dcd7d3d8b9f3a86ab9f98ecd1b84de516abaf620df29c1ad1ab612e80d" "transfer" (func $main/token_transfer (param i32 f64)))
 (global $~lib/memory/__data_end i32 (i32.const 60))
 (global $~lib/memory/__stack_pointer (mut i32) (i32.const 32828))
 (global $~lib/memory/__heap_base i32 (i32.const 32828))
 (memory $0 1)
 (data $0 (i32.const 12) ",\00\00\00\00\00\00\00\00\00\00\00\02\00\00\00\12\00\00\00<\00a\00d\00d\00r\00e\00s\00s\00>\00\00\00\00\00\00\00\00\00\00\00")
 (table $0 1 1 funcref)
 (elem $0 (i32.const 1))
 (export "main" (func $main/main))
 (export "memory" (memory $0))
 (func $main/main
  i32.const 32
  f64.const 100
  call $main/token_transfer
 )
)
