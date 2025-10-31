(module
 (type $0 (func (param f64) (result f64)))
 (type $1 (func))
 (import "./959dd33f208fdfbc9f140860b5b205245eac90e20825305c34a11f0a6ab0af43.wat" "f" (func $main/f (param f64) (result f64)))
 (global $~lib/memory/__data_end i32 (i32.const 8))
 (global $~lib/memory/__stack_pointer (mut i32) (i32.const 32776))
 (global $~lib/memory/__heap_base i32 (i32.const 32776))
 (memory $0 0)
 (table $0 1 1 funcref)
 (elem $0 (i32.const 1))
 (export "main" (func $main/main))
 (export "memory" (memory $0))
 (func $main/main
  f64.const 42
  call $main/f
  drop
 )
)
