import  { INFO, rtti, makeValiFactory, newRtti, standardValis } from './index.mjs' ;


test('INFO undefined'  , ()=>{  expect( rtti.undefined (              )(INFO        )).toBe('undefined'         ); } );
test('INFO null'       , ()=>{  expect( rtti.null      (              )(INFO        )).toBe('null'              ); } );
test('INFO boolean'    , ()=>{  expect( rtti.boolean   (              )(INFO        )).toBe('boolean'           ); } );
test('INFO number'     , ()=>{  expect( rtti.number    (              )(INFO        )).toBe('number'            ); } );
test('INFO string'     , ()=>{  expect( rtti.string    (              )(INFO        )).toBe('string'            ); } );
test('INFO bigint'     , ()=>{  expect( rtti.bigint    (              )(INFO        )).toBe('bigint'            ); } );
test('INFO symbol'     , ()=>{  expect( rtti.symbol    (              )(INFO        )).toBe('symbol'            ); } );
test('INFO function'   , ()=>{  expect( rtti.function  (              )(INFO        )).toBe('function'          ); } );
test('INFO not'        , ()=>{  expect( rtti.not       (rtti.boolean())(INFO        )).toBe('not'               ); } );
test('INFO or'         , ()=>{  expect( rtti.or        (rtti.boolean())(INFO        )).toBe('or'                ); } );
test('INFO and'        , ()=>{  expect( rtti.and       (rtti.boolean())(INFO        )).toBe('and'               ); } );

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
  const def = rtti.array(
    rtti.number(),
  );
  expect( def([0,         1,   2,       3,    4,    5])).toBe( true  );
  expect( def([0,         1,   2,   false,    4,    5])).toBe( false );
  expect( def([0,         1,   2,       3, "ff",    5])).toBe( false );
  expect( def([0, BigInt(1),   2,       3,    4,    5])).toBe( false );
});


test('test', ()=>{
  const t_person = rtti.object({
    name    : rtti.string(),
    age     : rtti.number(),
    visited : rtti.boolean(),
    since   : (o)=>o instanceof Date,
  });

  const val4 = {
    name    :'John',
    age     : 42,
    visited : true,
    since   : new Date('24 Jan 1986 17:58:24 -0700'),
  };

  const val5 = {
    name    :'John',
    age     : 42,
    visited : true,
    since   : { is_wrong_date  : true }
  };

  console.error( t_person( val4 ) ); // true
  console.error( t_person( val5 ) ); // true
});










test('compiler test basic 1', ()=>{
  const factory = rtti`
    object(
      name : string(),
      age  : number(),
      field : or( number(), string() ),
      attrs : object(
        foo: string(),
        bar: number(),
      ),
      arr_test : array(
        not( number()),
      ),
    )
  `;

  expect( factory.script ).toBe(`
    rtti.object({
      name : rtti.string(),
      age  : rtti.number(),
      field : rtti.or( rtti.number(), rtti.string() ),
      attrs : rtti.object({
        foo: rtti.string(),
        bar: rtti.number(),
      }),
      arr_test : rtti.array(
        rtti.not( rtti.number()),
      ),
    })
  `.trim());

  const vali = factory();
  console.error({factory,vali});
});

test('compiler test basic 2', ()=>{
  expect( rtti`string()`()(INFO) ).toBe( 'string' );
  expect( rtti`number()`()(INFO) ).toBe( 'number' );

  expect( rtti`string()`()('hello') ).toBe( true  );
  expect( rtti`string()`()( 123   ) ).toBe( false );
  expect( rtti`number()`()( 123   ) ).toBe( true  );
  expect( rtti`number()`()('hello') ).toBe( false );
});

test('COMPILER INFO undefined'  , ()=>{  expect( rtti`undefined ()` (              )(INFO        )).toBe('undefined'         ); } );
test('COMPILER INFO null'       , ()=>{  expect( rtti`null      ()` (              )(INFO        )).toBe('null'              ); } );
test('COMPILER INFO boolean'    , ()=>{  expect( rtti`boolean   ()` (              )(INFO        )).toBe('boolean'           ); } );
test('COMPILER INFO number'     , ()=>{  expect( rtti`number    ()` (              )(INFO        )).toBe('number'            ); } );
test('COMPILER INFO string'     , ()=>{  expect( rtti`string    ()` (              )(INFO        )).toBe('string'            ); } );
test('COMPILER INFO bigint'     , ()=>{  expect( rtti`bigint    ()` (              )(INFO        )).toBe('bigint'            ); } );
test('COMPILER INFO symbol'     , ()=>{  expect( rtti`symbol    ()` (              )(INFO        )).toBe('symbol'            ); } );
test('COMPILER INFO function'   , ()=>{  expect( rtti`function  ()` (              )(INFO        )).toBe('function'          ); } );
test('COMPILER INFO not'        , ()=>{  expect( rtti`not       (boolean())`(      )(INFO        )).toBe('not'               ); } );
test('COMPILER INFO or'         , ()=>{  expect( rtti`or        (boolean())`(      )(INFO        )).toBe('or'                ); } );
test('COMPILER INFO and'        , ()=>{  expect( rtti`and       (boolean())`(      )(INFO        )).toBe('and'               ); } );

test('COMPILER CHECK undefined' , ()=>{  expect( rtti`undefined ()` (              )(undefined   )).toBe(true                ); } );
test('COMPILER CHECK null'      , ()=>{  expect( rtti`null      ()` (              )(null        )).toBe(true                ); } );
test('COMPILER CHECK boolean 1' , ()=>{  expect( rtti`boolean   ()` (              )(true        )).toBe(true                ); } );
test('COMPILER CHECK boolean 2' , ()=>{  expect( rtti`boolean   ()` (              )(false       )).toBe(true                ); } );
test('COMPILER CHECK number'    , ()=>{  expect( rtti`number    ()` (              )(100000      )).toBe(true                ); } );
test('COMPILER CHECK string'    , ()=>{  expect( rtti`string    ()` (              )("fooo"      )).toBe(true                ); } );
test('COMPILER CHECK bigint'    , ()=>{  expect( rtti`bigint    ()` (              )(BigInt(1)   )).toBe(true                ); } );
test('COMPILER CHECK symbol'    , ()=>{  expect( rtti`symbol    ()` (              )(Symbol('1') )).toBe(true                ); } );
test('COMPILER CHECK function'  , ()=>{  expect( rtti`function  ()` (              )(()=>{}      )).toBe(true                ); } );
test('COMPILER CHECK not ERR'   , ()=>{  expect( ()=>rtti`not   (              )`()(            )).toThrow(     RangeError   ); } );
test('COMPILER CHECK or ERR'    , ()=>{  expect( ()=>rtti`or    (              )`()(            )).toThrow(     RangeError   ); } );
test('COMPILER CHECK and ERR'   , ()=>{  expect( ()=>rtti`and   (              )`()(            )).toThrow(     RangeError   ); } );
test('COMPILER CHECK not OK'    , ()=>{  expect( ()=>rtti`not   (rtti.number() )`()(            )).not.toThrow( RangeError   ); } );
test('COMPILER CHECK or OK'     , ()=>{  expect( ()=>rtti`or    (rtti.number() )`()(            )).not.toThrow( RangeError   ); } );
test('COMPILER CHECK and OK'    , ()=>{  expect( ()=>rtti`and   (rtti.number() )`()(            )).not.toThrow( RangeError   ); } );




test('equals',()=>{
  expect( rtti.equals( 'hello' )( 'hello'    ) ).toBe( true );
  expect( rtti.equals( 'hello' )( 'NO hello' ) ).toBe( false );
  expect( rtti.equals( 123 )( '123' ) ).toBe( false );
  expect( rtti.equals( false )( 'false' ) ).toBe( false );
  expect( rtti.equals( false )( false ) ).toBe( true );
  expect( rtti.equals( null )( undefined ) ).toBe( false );
  expect( rtti.equals( null )( null  ) ).toBe( true );
});

test('uuid',()=>{
  expect( rtti.uuid()( 'hello'    ) ).toBe( false );
  expect( rtti.uuid()( 'NO hello' ) ).toBe( false );
  expect( rtti.uuid()( '123'   ) ).toBe( false );
  expect( rtti.uuid()( 'false' ) ).toBe( false );
  expect( rtti.uuid()( false   ) ).toBe( false );
  expect( rtti.uuid()( undefined ) ).toBe( false );
  expect( rtti.uuid()( null     ) ).toBe( false );
  expect( rtti.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e67' ) ).toBe( true );
  expect( rtti.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7m37e67' ) ).toBe( false );
  expect( rtti.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e677' ) ).toBe( false );
  expect( rtti.uuid()( '2a945d9d-2cfb423b-afb2-362ea7c37e677' ) ).toBe( false );

});

