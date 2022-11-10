import  { RTTI,INFO,mkrtti,rtti } from './index.mjs' ;


test('INFO undefined'  , ()=>{  expect( rtti.undefined (              )(            )).toBe('undefined'         ); } );
test('INFO null'       , ()=>{  expect( rtti.null      (              )(            )).toBe('null'              ); } );
test('INFO boolean'    , ()=>{  expect( rtti.boolean   (              )(            )).toBe('boolean'           ); } );
test('INFO number'     , ()=>{  expect( rtti.number    (              )(            )).toBe('number'            ); } );
test('INFO string'     , ()=>{  expect( rtti.string    (              )(            )).toBe('string'            ); } );
test('INFO bigint'     , ()=>{  expect( rtti.bigint    (              )(            )).toBe('bigint'            ); } );
test('INFO symbol'     , ()=>{  expect( rtti.symbol    (              )(            )).toBe('symbol'            ); } );
test('INFO function'   , ()=>{  expect( rtti.function  (              )(            )).toBe('function'          ); } );
test('INFO not'        , ()=>{  expect( rtti.not       (rtti.boolean())(            )).toBe('not'               ); } );
test('INFO or'         , ()=>{  expect( rtti.or        (rtti.boolean())(            )).toBe('or'                ); } );
test('INFO and'        , ()=>{  expect( rtti.and       (rtti.boolean())(            )).toBe('and'               ); } );

test('CHECK undefined' , ()=>{  expect( rtti.undefined (              )(undefined   )).toBe(true                ); } );
test('CHECK null'      , ()=>{  expect( rtti.null      (              )(null        )).toBe(true                ); } );
test('CHECK boolean 1' , ()=>{  expect( rtti.boolean   (              )(true        )).toBe(true                ); } );
test('CHECK boolean 2' , ()=>{  expect( rtti.boolean   (              )(false       )).toBe(true                ); } );
test('CHECK number'    , ()=>{  expect( rtti.number    (              )(100000      )).toBe(true                ); } );
test('CHECK string'    , ()=>{  expect( rtti.string    (              )("fooo"      )).toBe(true                ); } );
test('CHECK bigint'    , ()=>{  expect( rtti.bigint    (              )(BigInt(1)   )).toBe(true                ); } );
test('CHECK symbol'    , ()=>{  expect( rtti.symbol    (              )(Symbol('1') )).toBe(true                ); } );
test('CHECK function'  , ()=>{  expect( rtti.function  (              )(()=>{}      )).toBe(true                ); } );
test('CHECK not ERR'   , ()=>{  expect( ()=>rtti.not   (              )(            )).toThrow(     RangeError  ); } );
test('CHECK or ERR'    , ()=>{  expect( ()=>rtti.or    (              )(            )).toThrow(     RangeError  ); } );
test('CHECK and ERR'   , ()=>{  expect( ()=>rtti.and   (              )(            )).toThrow(     RangeError  ); } );
test('CHECK not OK'    , ()=>{  expect( ()=>rtti.not   (rtti.number() )(            )).not.toThrow( RangeError  ); } );
test('CHECK or OK'     , ()=>{  expect( ()=>rtti.or    (rtti.number() )(            )).not.toThrow( RangeError  ); } );
test('CHECK and OK'    , ()=>{  expect( ()=>rtti.and   (rtti.number() )(            )).not.toThrow( RangeError  ); } );

/**
 * The primitive evaluators always return false when the given argument is
 * undefined or null, unless they are either undefined() or null().
 */
test( 'NULL CHECK ', ()=>{
  expect( rtti.undefined()( undefined  )).toBe( true  );
  expect( rtti.null()     ( undefined  )).toBe( false );
  expect( rtti.undefined()( null       )).toBe( false );
  expect( rtti.null()     ( null       )).toBe( true  );
  expect( rtti.boolean()  ( null       )).toBe( false );
  expect( rtti.number()   ( null       )).toBe( false );
  expect( rtti.string()   ( null       )).toBe( false );
  expect( rtti.bigint()   ( null       )).toBe( false );
  expect( rtti.symbol()   ( null       )).toBe( false );
  expect( rtti.function() ( null       )).toBe( false );
});

/**
 * test `not`
 */
test( 'CHECK2 not', ()=>{
  expect( rtti.not( rtti.string())( false         )).toBe( true  );
  expect( rtti.not( rtti.string())( "some string" )).toBe( false );
  expect( rtti.not( rtti.string())( 12345 + 234   )).toBe( true  );
  expect( rtti.not( rtti.string())( null          )).toBe( true  );
  expect( rtti.not( rtti.string())( 1             )).toBe( true  );
  expect( rtti.not( rtti.string())( BigInt(100)   )).toBe( true  );
});

test( 'CHECK2 or', ()=>{
  expect( rtti.or( rtti.number(), rtti.string()              )( false         )).toBe( false );
  expect( rtti.or( rtti.number(), rtti.string()              )( "some string" )).toBe( true  );
  expect( rtti.or( rtti.number(), rtti.string()              )( 12345 + 234   )).toBe( true  );
  expect( rtti.or( rtti.number(), rtti.string()              )( null          )).toBe( false );
  expect( rtti.or( rtti.number(), rtti.string(), rtti.null() )( null          )).toBe( true  );
  expect( rtti.or( rtti.number(), rtti.string(), rtti.null() )( 1             )).toBe( true  );
  expect( rtti.or( rtti.number(), rtti.string(), rtti.null() )( BigInt(100)   )).toBe( false );
});

/*
 * test `and`
 *
 * Notice you should not find yourself to check if it is null or undefined
 * since all primitive evaluators return false when the argument is either
 * undefined or null.
 */
test( 'CHECK2 and', ()=>{
  expect( rtti.and( rtti.undefined(), rtti.not(rtti.null()      ))( undefined      )).toBe( true );
  expect( rtti.and( rtti.null(),      rtti.not(rtti.undefined() ))( null           )).toBe( true );
  expect( rtti.and( rtti.boolean(),   rtti.not(rtti.null()      ))( false          )).toBe( true );
  expect( rtti.and( rtti.number(),    rtti.not(rtti.null()      ))( 10000          )).toBe( true );
  expect( rtti.and( rtti.string(),    rtti.not(rtti.null()      ))( "hello"        )).toBe( true );
  expect( rtti.and( rtti.bigint(),    rtti.not(rtti.null()      ))( BigInt(1)      )).toBe( true );
  expect( rtti.and( rtti.symbol(),    rtti.not(rtti.null()      ))( Symbol('foo')  )).toBe( true );
  expect( rtti.and( rtti.function(),  rtti.not(rtti.null()      ))( ()=>{}         )).toBe( true );

  expect( rtti.and( rtti.undefined(), rtti.not(rtti.null()      ))( null           )).toBe( false );
  expect( rtti.and( rtti.null(),      rtti.not(rtti.undefined() ))( undefined      )).toBe( false );
  expect( rtti.and( rtti.boolean(),   rtti.not(rtti.null()      ))( null           )).toBe( false );
  expect( rtti.and( rtti.number(),    rtti.not(rtti.null()      ))( null           )).toBe( false );
  expect( rtti.and( rtti.string(),    rtti.not(rtti.null()      ))( null           )).toBe( false );
  expect( rtti.and( rtti.bigint(),    rtti.not(rtti.null()      ))( null           )).toBe( false );
  expect( rtti.and( rtti.symbol(),    rtti.not(rtti.null()      ))( null           )).toBe( false );
  expect( rtti.and( rtti.function(),  rtti.not(rtti.null()      ))( null           )).toBe( false );
});

test('CHECK Object',()=>{
  const def = rtti.object({
    a:rtti.boolean(),
    b:rtti.number(),
  });
  expect( def({ a:true, b:1,     })).toBe( true  );
  expect( def({ a:1,    b:1,     })).toBe( false );
  expect( def({ a:true, b:false, })).toBe( false );
  expect( def({ a:1   , b:false, })).toBe( false );
});


test('CHECK Array',()=>{
  const def = rtti.array({
    of : rtti.number(),
  });
  expect( def([0,         1,   2,       3,    4,    5])).toBe( true  );
  expect( def([0,         1,   2,   false,    4,    5])).toBe( false );
  expect( def([0,         1,   2,       3, "ff",    5])).toBe( false );
  expect( def([0, BigInt(1),   2,       3,    4,    5])).toBe( false );
});


