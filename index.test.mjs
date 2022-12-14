import  { INFO, schema, make_vali_factory } from './index.mjs' ;


function getStackFromError(o) {
  if ( o == null ) {
    return o;
  } else if ( typeof o === 'object' ) {
    if ( 'stack' in o ) {
      if ( Array.isArray( o.stack ) ) {
        return o.stack;
      } else {
        if ( typeof o.stack === 'string' ) {
          return o.stack.split('\n');
        } else {
          // 1. this could be erroneous value but we ignore it.
          // 2. ensure it to be an array.
          return [ o.stack] ;
        }
      }
    } else {
      // ensure the result is an array.
      return [];
    }
  } else {
    // cannot retrieve stack; but we have to ensure it to be an array.
    return [];
  }
}

function filterErrorToJSONFriendly(o) {
  if ( o instanceof Error ) {
    return {
      message : o.message,
      stack   : getStackFromError( o ),
      cause   : filterErrorToJSONFriendly( o.cause ),
    };
  } else if ( o === null ) {
    return null;
  } else if ( o === undefined ) {
    return undefined;
  } else if ( typeof o === 'object' ) {
    return Object.assign( Array.isArray( o ) ? [] : {}, ... Object.keys(o).map(k=>({[k]:filterErrorToJSONFriendly(o[k])})));
  } else {
    return o;
  }
}

expect.extend({
  toProperlyReturn( received, expected ) {
    let returned  = null;
    try {
      returned = received();
    } catch( e ) {
      console.error( ',,,,,,,,,,,,,,,,,,,,,,',e );
      return {
        message: () => `the function has thrown an error : ${ JSON.stringify( filterErrorToJSONFriendly(e),null,2 )   }`,
        pass: false,
      };
    }

    try {
      const wasExpected = expected( returned );
      if ( wasExpected ) {
        return {
          message: () => `Successed`,
          pass: true,
        };
      } else {
        return {
          message: () => `Failed ${ JSON.stringify( filterErrorToJSONFriendly( returned ),null,2 )   } `,
          pass: false,
        };
      }
    } catch ( e ) {
      return {
        message: () => `Failed. Reason : ${ JSON.stringify( filterErrorToJSONFriendly(e),null,2) }`,
        pass: false,
      };
    }
  },
  toProperlyThrow( received, expected ) {
    let thrown  = null;
    try {
      received();
      return {
        message: () => `the function did not throw`,
        pass: false,
      };
    } catch( e ) {
      thrown = e;
    }

    try {
      const wasExpected = expected( thrown );
      if ( wasExpected ) {
        return {
          message: () => `Successed`,
          pass: true,
        };
      } else {
        return {
          message: () => `Failed. Reason : ${ JSON.stringify( filterErrorToJSONFriendly( thrown ),null,2) }`,
          pass: false,
        };
      }
    } catch ( e ) {
      return {
        message: () => `Failed. Reason : ${ JSON.stringify( filterErrorToJSONFriendly(e),null,2) }`,
        pass: false,
      };
    }
  },
});

/*
 * test('test test true',()=>{
 *   expect( ()=>'foo' ).toProperlyReturn( (v)=>v==='foo' );
 * });
 * test('test test false',()=>{
 *   expect( ()=>'foo' ).toProperlyReturn( (v)=>v!=='foo' );
 * });
 * test('test test thrown',()=>{
 *   expect( ()=>'foo' ).toProperlyReturn( (v)=>{throw new Error( 'foo', {cause: new Error('bar', {cause:new RangeError()})})});
 * });
 * 
 * test('test test toProperlyThrow throw',()=>{
 *   expect( ()=>{ throw 'foo' } ).toProperlyThrow( (v)=>true );
 * });
 * test('test test toProperlyThrow not throw ',()=>{
 *   expect( ()=>{             } ).toProperlyThrow( (v)=>true );
 * });
 * test('test test toProperlyThrow throw and throw',()=>{
 *   expect( ()=>{ throw 'foo' } ).toProperlyThrow( (v)=>{throw new Error( 'foo', {cause: new Error('bar', {cause:new RangeError()})})});
 * });
 */

test('INFO undefined'  , ()=>{  expect( schema.undefined (              )(INFO            )).toBe('undefined'         ); } );
test('INFO null'       , ()=>{  expect( schema.null      (              )(INFO            )).toBe('null'              ); } );
test('INFO boolean'    , ()=>{  expect( schema.boolean   (              )(INFO            )).toBe('boolean'           ); } );
test('INFO number'     , ()=>{  expect( schema.number    (              )(INFO            )).toBe('number'            ); } );
test('INFO string'     , ()=>{  expect( schema.string    (              )(INFO            )).toBe('string'            ); } );
test('INFO bigint'     , ()=>{  expect( schema.bigint    (              )(INFO            )).toBe('bigint'            ); } );
test('INFO symbol'     , ()=>{  expect( schema.symbol    (              )(INFO            )).toBe('symbol'            ); } );
test('INFO function'   , ()=>{  expect( schema.function  (              )(INFO            )).toBe('function'          ); } );
test('INFO not'        , ()=>{  expect( schema.not       (schema.boolean())(INFO            )).toBe('not'               ); } );
test('INFO or'         , ()=>{  expect( schema.or        (schema.boolean())(INFO            )).toBe('or'                ); } );
test('INFO and'        , ()=>{  expect( schema.and       (schema.boolean())(INFO            )).toBe('and'               ); } );

test('CHECK undefined' , ()=>{  expect( schema.undefined (              )(undefined       )).toBe(true                ); } );
test('CHECK null'      , ()=>{  expect( schema.null      (              )(null            )).toBe(true                ); } );
test('CHECK boolean 1' , ()=>{  expect( schema.boolean   (              )(true            )).toBe(true                ); } );
test('CHECK boolean 2' , ()=>{  expect( schema.boolean   (              )(false           )).toBe(true                ); } );
test('CHECK number'    , ()=>{  expect( schema.number    (              )(100000          )).toBe(true                ); } );
test('CHECK string'    , ()=>{  expect( schema.string    (              )("fooo"          )).toBe(true                ); } );
test('CHECK bigint'    , ()=>{  expect( schema.bigint    (              )(BigInt(1)       )).toBe(true                ); } );
test('CHECK symbol'    , ()=>{  expect( schema.symbol    (              )(Symbol('1')     )).toBe(true                ); } );
test('CHECK function'  , ()=>{  expect( schema.function  (              )(()=>{}          )).toBe(true                ); } );
test('CHECK function'  , ()=>{  expect( schema.function  (              )(function(){}    )).toBe(true                ); } );
test('CHECK function'  , ()=>{  expect( schema.function  (              )(new Function(''))).toBe(true                ); } );
test('CHECK not ERR'   , ()=>{  expect( ()=>schema.not   (              )(                )).toProperlyThrow((o)=>o instanceof RangeError  ); } );
test('CHECK or ERR'    , ()=>{  expect( ()=>schema.or    (              )(                )).toProperlyThrow((o)=>o instanceof RangeError  ); } );
test('CHECK and ERR'   , ()=>{  expect( ()=>schema.and   (              )(                )).toProperlyThrow((o)=>o instanceof RangeError  ); } );
test('CHECK not OK'    , ()=>{  expect( ()=>schema.not   (schema.number() )(                )).toProperlyReturn( (o)=>true ); } );
test('CHECK or OK'     , ()=>{  expect( ()=>schema.or    (schema.number() )(                )).toProperlyReturn( (o)=>true ); } );
test('CHECK and OK'    , ()=>{  expect( ()=>schema.and   (schema.number() )(                )).toProperlyReturn( (o)=>true ); } );

/**
 * The primitive evaluators always return false when the given argument is
 * undefined or null, unless they are either undefined() or null().
 */
test( 'NULL CHECK ', ()=>{
  expect( schema.undefined()( undefined  )).toBe( true  );
  expect( schema.null()     ( undefined  )).toBe( false );
  expect( schema.undefined()( null       )).toBe( false );
  expect( schema.null()     ( null       )).toBe( true  );
  expect( schema.boolean()  ( null       )).toBe( false );
  expect( schema.number()   ( null       )).toBe( false );
  expect( schema.string()   ( null       )).toBe( false );
  expect( schema.bigint()   ( null       )).toBe( false );
  expect( schema.symbol()   ( null       )).toBe( false );
  expect( schema.function() ( null       )).toBe( false );
});

/**
 * test `not`
 */
test( 'CHECK2 not', ()=>{
  expect( schema.not( schema.string())( false         )).toBe( true  );
  expect( schema.not( schema.string())( "some string" )).toBe( false );
  expect( schema.not( schema.string())( 12345 + 234   )).toBe( true  );
  expect( schema.not( schema.string())( null          )).toBe( true  );
  expect( schema.not( schema.string())( 1             )).toBe( true  );
  expect( schema.not( schema.string())( BigInt(100)   )).toBe( true  );
});

test( 'CHECK2 or', ()=>{
  expect( schema.or( schema.number(), schema.string()              )( false         )).toBe( false );
  expect( schema.or( schema.number(), schema.string()              )( "some string" )).toBe( true  );
  expect( schema.or( schema.number(), schema.string()              )( 12345 + 234   )).toBe( true  );
  expect( schema.or( schema.number(), schema.string()              )( null          )).toBe( false );
  expect( schema.or( schema.number(), schema.string(), schema.null() )( null          )).toBe( true  );
  expect( schema.or( schema.number(), schema.string(), schema.null() )( 1             )).toBe( true  );
  expect( schema.or( schema.number(), schema.string(), schema.null() )( BigInt(100)   )).toBe( false );
});

/*
 * test `and`
 *
 * Notice you should not find yourself to check if it is null or undefined
 * since all primitive evaluators return false when the argument is either
 * undefined or null.
 */
test( 'CHECK2 and', ()=>{
  expect( schema.and( schema.undefined(), schema.not(schema.null()      ))( undefined      )).toBe( true );
  expect( schema.and( schema.null(),      schema.not(schema.undefined() ))( null           )).toBe( true );
  expect( schema.and( schema.boolean(),   schema.not(schema.null()      ))( false          )).toBe( true );
  expect( schema.and( schema.number(),    schema.not(schema.null()      ))( 10000          )).toBe( true );
  expect( schema.and( schema.string(),    schema.not(schema.null()      ))( "hello"        )).toBe( true );
  expect( schema.and( schema.bigint(),    schema.not(schema.null()      ))( BigInt(1)      )).toBe( true );
  expect( schema.and( schema.symbol(),    schema.not(schema.null()      ))( Symbol('foo')  )).toBe( true );
  expect( schema.and( schema.function(),  schema.not(schema.null()      ))( ()=>{}         )).toBe( true );

  expect( schema.and( schema.undefined(), schema.not(schema.null()      ))( null           )).toBe( false );
  expect( schema.and( schema.null(),      schema.not(schema.undefined() ))( undefined      )).toBe( false );
  expect( schema.and( schema.boolean(),   schema.not(schema.null()      ))( null           )).toBe( false );
  expect( schema.and( schema.number(),    schema.not(schema.null()      ))( null           )).toBe( false );
  expect( schema.and( schema.string(),    schema.not(schema.null()      ))( null           )).toBe( false );
  expect( schema.and( schema.bigint(),    schema.not(schema.null()      ))( null           )).toBe( false );
  expect( schema.and( schema.symbol(),    schema.not(schema.null()      ))( null           )).toBe( false );
  expect( schema.and( schema.function(),  schema.not(schema.null()      ))( null           )).toBe( false );
});

test('CHECK Object',()=>{
  const def = schema.object({
    a:schema.boolean(),
    b:schema.number(),
  });
  expect( def({ a:true, b:1,     })).toBe( true  );
  expect( def({ a:1,    b:1,     })).toBe( false );
  expect( def({ a:true, b:false, })).toBe( false );
  expect( def({ a:1   , b:false, })).toBe( false );
});


test('CHECK ARRAY_OF',()=>{
  const def = schema.array_of(
    schema.number(),
  );
  expect( def([0,         1,   2,       3,    4,    5])).toBe( true  );
  expect( def([0,         1,   2,   false,    4,    5])).toBe( false );
  expect( def([0,         1,   2,       3, "ff",    5])).toBe( false );
  expect( def([0, BigInt(1),   2,       3,    4,    5])).toBe( false );
});


test('test', ()=>{
  const t_person = schema.object({
    name    : schema.string(),
    age     : schema.number(),
    visited : schema.boolean(),
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





/*
 *
 */

/*
 * the standard statement compiler ( v2 )
 */
test('STATEMENT COMPILER test basic 1', ()=>{
  const factory = schema.statement`
    object(
      name : string(),
      age  : number(),
      field : or( number(), string() ),
      attrs : object(
        foo: string(),
        bar: number(),
      ),
      arr_test : array_of(
        not( number()),
      ),
    )
  `;

  expect( factory.script ).toBe(`
    schema.object({
      name : schema.string(),
      age  : schema.number(),
      field : schema.or( schema.number(), schema.string() ),
      attrs : schema.object({
        foo: schema.string(),
        bar: schema.number(),
      }),
      arr_test : schema.array_of(
        schema.not( schema.number()),
      ),
    })
  `);

  const vali = factory();
  console.error({factory,vali});
});

test('STATEMENT COMPILER test basic 2', ()=>{
  expect( schema.statement`string()`()(INFO) ).toBe( 'string' );
  expect( schema.statement`number()`()(INFO) ).toBe( 'number' );

  expect( schema.statement`string()`()('hello') ).toBe( true  );
  expect( schema.statement`string()`()( 123   ) ).toBe( false );
  expect( schema.statement`number()`()( 123   ) ).toBe( true  );
  expect( schema.statement`number()`()('hello') ).toBe( false );
});

test('STATEMENT COMPILER INFO undefined'  , ()=>{  expect( schema.statement`undefined ()`              ()(INFO        )).toBe('undefined'          ); } );
test('STATEMENT COMPILER INFO null'       , ()=>{  expect( schema.statement`null      ()`              ()(INFO        )).toBe('null'               ); } );
test('STATEMENT COMPILER INFO boolean'    , ()=>{  expect( schema.statement`boolean   ()`              ()(INFO        )).toBe('boolean'            ); } );
test('STATEMENT COMPILER INFO number'     , ()=>{  expect( schema.statement`number    ()`              ()(INFO        )).toBe('number'             ); } );
test('STATEMENT COMPILER INFO string'     , ()=>{  expect( schema.statement`string    ()`              ()(INFO        )).toBe('string'             ); } );
test('STATEMENT COMPILER INFO bigint'     , ()=>{  expect( schema.statement`bigint    ()`              ()(INFO        )).toBe('bigint'             ); } );
test('STATEMENT COMPILER INFO symbol'     , ()=>{  expect( schema.statement`symbol    ()`              ()(INFO        )).toBe('symbol'             ); } );
test('STATEMENT COMPILER INFO function'   , ()=>{  expect( schema.statement`function  ()`              ()(INFO        )).toBe('function'           ); } );
test('STATEMENT COMPILER INFO not'        , ()=>{  expect( schema.statement`not       (boolean())`     ()(INFO        )).toBe('not'                ); } );
test('STATEMENT COMPILER INFO or'         , ()=>{  expect( schema.statement`or        (boolean())`     ()(INFO        )).toBe('or'                 ); } );
test('STATEMENT COMPILER INFO and'        , ()=>{  expect( schema.statement`and       (boolean())`     ()(INFO        )).toBe('and'                ); } );

test('STATEMENT COMPILER CHECK undefined' , ()=>{  expect( schema.statement`undefined ()`              ()(undefined   )).toBe(true                 ); } );
test('STATEMENT COMPILER CHECK null'      , ()=>{  expect( schema.statement`null      ()`              ()(null        )).toBe(true                 ); } );
test('STATEMENT COMPILER CHECK boolean 1' , ()=>{  expect( schema.statement`boolean   ()`              ()(true        )).toBe(true                 ); } );
test('STATEMENT COMPILER CHECK boolean 2' , ()=>{  expect( schema.statement`boolean   ()`              ()(false       )).toBe(true                 ); } );
test('STATEMENT COMPILER CHECK number'    , ()=>{  expect( schema.statement`number    ()`              ()(100000      )).toBe(true                 ); } );
test('STATEMENT COMPILER CHECK string'    , ()=>{  expect( schema.statement`string    ()`              ()("fooo"      )).toBe(true                 ); } );
test('STATEMENT COMPILER CHECK bigint'    , ()=>{  expect( schema.statement`bigint    ()`              ()(BigInt(1)   )).toBe(true                 ); } );
test('STATEMENT COMPILER CHECK symbol'    , ()=>{  expect( schema.statement`symbol    ()`              ()(Symbol('1') )).toBe(true                 ); } );
test('STATEMENT COMPILER CHECK function'  , ()=>{  expect( schema.statement`function  ()`              ()(()=>{}      )).toBe(true                 ); } );
test('STATEMENT COMPILER CHECK not ERR'   , ()=>{  expect( ()=>schema.statement`not   (              )`()(            )).toProperlyThrow(     (o)=>o instanceof RangeError   ); } );
test('STATEMENT COMPILER CHECK or ERR'    , ()=>{  expect( ()=>schema.statement`or    (              )`()(            )).toProperlyThrow(     (o)=>o instanceof RangeError   ); } );
test('STATEMENT COMPILER CHECK and ERR'   , ()=>{  expect( ()=>schema.statement`and   (              )`()(            )).toProperlyThrow(     (o)=>o instanceof RangeError   ); } );
test('STATEMENT COMPILER CHECK not OK'    , ()=>{  expect( ()=>schema.statement`not   (schema.number() )`()(            )).not.toProperlyThrow( (o)=>false   ); } );
test('STATEMENT COMPILER CHECK or OK'     , ()=>{  expect( ()=>schema.statement`or    (schema.number() )`()(            )).not.toProperlyThrow( (o)=>false   ); } );
test('STATEMENT COMPILER CHECK and OK'    , ()=>{  expect( ()=>schema.statement`and   (schema.number() )`()(            )).not.toProperlyThrow( (o)=>false   ); } );





/*
 * the standard statement compiler ( for backward compatibility )
 */
test('STATEMENT COMPILER BACKWARD COMPATIBILITY TEST basic 1', ()=>{
  const factory = schema`
    object(
      name : string(),
      age  : number(),
      field : or( number(), string() ),
      attrs : object(
        foo: string(),
        bar: number(),
      ),
      arr_test : array_of(
        not( number()),
      ),
    )
  `;

  expect( factory.script ).toBe(`
    schema.object({
      name : schema.string(),
      age  : schema.number(),
      field : schema.or( schema.number(), schema.string() ),
      attrs : schema.object({
        foo: schema.string(),
        bar: schema.number(),
      }),
      arr_test : schema.array_of(
        schema.not( schema.number()),
      ),
    })
  `);

  const vali = factory();
  console.error({factory,vali});
});

test('STATEMENT COMPILER BACKWARD COMPATIBILITY TEST basic 2', ()=>{
  expect( schema`string()`()(INFO) ).toBe( 'string' );
  expect( schema`number()`()(INFO) ).toBe( 'number' );

  expect( schema`string()`()('hello') ).toBe( true  );
  expect( schema`string()`()( 123   ) ).toBe( false );
  expect( schema`number()`()( 123   ) ).toBe( true  );
  expect( schema`number()`()('hello') ).toBe( false );
});








/*
 * equals() and uuid()
 */

test('equals',()=>{
  expect( schema.equals( 'hello' )( 'hello'    ) ).toBe( true );
  expect( schema.equals( 'hello' )( 'NO hello' ) ).toBe( false );
  expect( schema.equals( 123     )( '123'      ) ).toBe( false );
  expect( schema.equals( false   )( 'false'    ) ).toBe( false );
  expect( schema.equals( false   )( false      ) ).toBe( true );
  expect( schema.equals( null    )( undefined  ) ).toBe( false );
  expect( schema.equals( null    )( null       ) ).toBe( true );
});

test('uuid',()=>{
  expect( schema.uuid()( 'hello'    ) ).toBe( false );
  expect( schema.uuid()( 'NO hello' ) ).toBe( false );
  expect( schema.uuid()( '123'      ) ).toBe( false );
  expect( schema.uuid()( 'false'    ) ).toBe( false );
  expect( schema.uuid()( false      ) ).toBe( false );
  expect( schema.uuid()( undefined  ) ).toBe( false );
  expect( schema.uuid()( null       ) ).toBe( false );
  expect( schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e67' ) ).toBe( true );
  expect( schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7m37e67' ) ).toBe( false );
  expect( schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e677' ) ).toBe( false );
  expect( schema.uuid()( '2a945d9d-2cfb423b-afb2-362ea7c37e677' ) ).toBe( false );

});



/*
 * clone()
 */
test('equals',()=>{
  // 0. clone the standard `schema` object.
  const rtti1 = schema.clone();
  const hello = (o)=>o==='hello';
  const world = (o)=>o==='world';
  const value = 'world';

  // 1. set constructor `hello` to the first cloned object.
  rtti1.hello = hello;
  expect( 'hello' in rtti1 ).toBe( true );
  expect( ()=>rtti1.statement`hello()`( value ) ).not.toThrow();

  // 2. clone again and confirm if the constructor `hello` is available on the
  //    second cloned object.
  const rtti2 = rtti1.clone();
  expect( 'hello' in rtti2 ).toBe( true );
  expect( ()=>rtti2.statement`hello()`( value ) ).not.toThrow();

  // 3.  confirm that setting `hello` does not affect to the original schema
  //     object.
  expect( 'hello' in schema ).toBe( false );
  expect( ()=>schema.statement`hello()`( value ) ).toThrow();

  // 4.  set constructor `world to the second cloned object.
  rtti2.world = world;
  expect( 'world' in rtti2 ).toBe( true );
  expect( 'world' in rtti1 ).toBe( false );
  expect( ()=>rtti2.statement`world()`( value ) ).not.toThrow();
  expect( ()=>rtti1.statement`world()`( value ) ).toThrow();
});



/*
 * any()
 */

test( 'ANY undefined'  , ()=>{ expect( schema.any()( undefined       )).toBe(true); } );
test( 'ANY null'       , ()=>{ expect( schema.any()( null            )).toBe(true); } );
test( 'ANY boolean'    , ()=>{ expect( schema.any()( false           )).toBe(true); } );
test( 'ANY number'     , ()=>{ expect( schema.any()( 1               )).toBe(true); } );
test( 'ANY string'     , ()=>{ expect( schema.any()( '1'             )).toBe(true); } );
test( 'ANY bigint'     , ()=>{ expect( schema.any()( BigInt(1)       )).toBe(true); } );
test( 'ANY symbol'     , ()=>{ expect( schema.any()( Symbol.for('1') )).toBe(true); } );
test( 'ANY function'   , ()=>{ expect( schema.any()( ()=>{}          )).toBe(true); } );



/**
 *
 * JavaScript Blocks in the Statement Compiler 
 *
 */

test('STATEMENT COMPILER JavaScript Blocks No.1', ()=>{
  const factory = schema.statement`
    object(
      name : string(),
      age  : number(),
      field : or( number(), string() ),
      attrs : object(
        foo: equals( << "hello world" >> ),
        bar: number(),
      ),
      arr_test : array_of(
        not( number()),
      ),
    )
  `;

  expect( factory.script ).toBe(`
    schema.object({
      name : schema.string(),
      age  : schema.number(),
      field : schema.or( schema.number(), schema.string() ),
      attrs : schema.object({
        foo: schema.equals(  "hello world"  ),
        bar: schema.number(),
      }),
      arr_test : schema.array_of(
        schema.not( schema.number()),
      ),
    })
  `);

  const vali = factory();
  console.error({factory,vali});
});



test('STATEMENT COMPILER JavaScript Blocks No.2', ()=>{
  const factory = schema.statement`
    object(
      name : equals( << "John Coltrane" >> ),
      age  : number(),
      field : or( number(), string() ),
      attrs : object(
        foo: equals( << "hello world" >> ),
        bar: number(),
      ),
      arr_test : array_of(
        not( number()),
      ),
    )
  `;

  expect( factory.script ).toBe(`
    schema.object({
      name : schema.equals(  "John Coltrane"  ),
      age  : schema.number(),
      field : schema.or( schema.number(), schema.string() ),
      attrs : schema.object({
        foo: schema.equals(  "hello world"  ),
        bar: schema.number(),
      }),
      arr_test : schema.array_of(
        schema.not( schema.number()),
      ),
    })
  `);

  const vali = factory();
  console.error({factory,vali});
});

test('STATEMENT COMPILER JavaScript Blocks No.3', ()=>{
  const factory = schema.statement`equals(<<10>>)`;
  expect( factory.script ).toBe(`schema.equals(10)`.trim());
  const vali = factory();
  console.error({factory,vali});
});

test('STATEMENT COMPILER JavaScript Blocks No.4', ()=>{
  const factory = schema.statement`number(<<>>)`;
  expect( factory.script ).toBe(`schema.number()`.trim());
  const vali = factory();
  console.error({factory,vali});
});


test('STATEMENT COMPILER JavaScript Blocks No.5', ()=>{
  const factory = schema.statement`number(<<1 + >><<2 + >><<3>>)`;
  expect( factory.script ).toBe(`schema.number(1 + 2 + 3)`.trim());
  const vali = factory();
  console.error({factory,vali});
});



test( 'CLONE TEST No.1', ()=>{
  const v = 'HELLO';

  // create namespace1.
  const rtti1 = schema.clone();

  // set a validator factory as `hello`.
  rtti1.hello = make_vali_factory( ()=>(o)=>o === 'hello' );

  // this should be false.
  expect( rtti1.statement`hello()`()( v ) ).toBe( false );

  // create namespace2.
  const rtti2 = schema.clone();

  // override `hello` as a different factory.
  rtti2.hello = make_vali_factory( ()=>(o)=>o === 'HELLO' );

  // `hello` should refer different factories depends on which namespace it is
  // called with.
  expect( rtti1.statement`hello()`()( v ) ).toBe( false );
  expect( rtti2.statement`hello()`()( v ) ).toBe( true );

  // this looks like it refers `rtti2.hello`
  const factory_by_rtti2 = rtti2.statement`hello()`;

  // set its namespace to `rtti1`
  rtti1.hello2 = factory_by_rtti2;

  // factory_by_rtti2 is called in the context of rtti1; this should refer
  // `rtti1.hello`; so this should be false.
  expect( rtti1.hello2()( v ) ).toBe( false ); 

  // if `factory_by_rtti2` is called without namespace, it refers the `rtti2`
  // where `factory_by_rtti2` comes from.
  expect( factory_by_rtti2()( v ) ).toBe( true ); 

});



test( 'ARRAY No.1', ()=>{
  const validator = schema.statement`
    array(
      equals( << 'a' >> ),
      equals( << 'b' >> ),
      equals( << 'c' >> ),
      )`();

  expect( validator(['a','b','c']) ).toBe( true );
  expect( validator(['a','b','d']) ).toBe( false );
  expect( validator(['a','b','c', 'd' ]) ).toBe( false );
  expect( validator(['a','b'          ]) ).toBe( false );

});



test( 'object with undefined No.1', ()=>{
  expect( schema.statement`
    object(
      a: or(
        undefined(),
        string()
      )
    )`()(
      {
      }
    )).toBe( true );
  expect( schema.statement`
    object(
      a: string()
    )`()(
      {
      }
    )).toBe( false );
});


test( 'informative error message No.1 ', ()=>{
  expect( ()=>schema.statement`
    object(
      a: string
    )`()(
      {
      }
    )).toProperlyThrow((e)=>e.message === "the specified validator returned a function not a boolean in `object`; probably you forgot to call your factory generator?\n\n    schema.object({\n      a: schema.string\n    })" );
});


