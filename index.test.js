
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


test('INFO undefined'  , ()=>{  assert.equal       ( schema.undefined (                )(INFO            ),'undefined()'         ); } );
test('INFO null'       , ()=>{  assert.equal       ( schema.null      (                )(INFO            ),'null()'              ); } );
test('INFO boolean'    , ()=>{  assert.equal       ( schema.boolean   (                )(INFO            ),'boolean()'           ); } );
test('INFO number'     , ()=>{  assert.equal       ( schema.number    (                )(INFO            ),'number()'            ); } );
test('INFO string'     , ()=>{  assert.equal       ( schema.string    (                )(INFO            ),'string()'            ); } );
test('INFO bigint'     , ()=>{  assert.equal       ( schema.bigint    (                )(INFO            ),'bigint()'            ); } );
test('INFO symbol'     , ()=>{  assert.equal       ( schema.symbol    (                )(INFO            ),'symbol()'            ); } );
test('INFO function'   , ()=>{  assert.equal       ( schema.function  (                )(INFO            ),'function()'          ); } );
test('INFO not'        , ()=>{  assert.equal       ( schema.not       (schema.boolean())(INFO            ),'not()'               ); } );
test('INFO or'         , ()=>{  assert.equal       ( schema.or        (schema.boolean())(INFO            ),'or()'                ); } );
test('INFO and'        , ()=>{  assert.equal       ( schema.and       (schema.boolean())(INFO            ),'and()'               ); } );

test('CHECK undefined' , ()=>{  assert.equal       ( schema.undefined (                )(undefined       ),true                ); } );
test('CHECK null'      , ()=>{  assert.equal       ( schema.null      (                )(null            ),true                ); } );
test('CHECK boolean 1' , ()=>{  assert.equal       ( schema.boolean   (                )(true            ),true                ); } );
test('CHECK boolean 2' , ()=>{  assert.equal       ( schema.boolean   (                )(false           ),true                ); } );
test('CHECK number'    , ()=>{  assert.equal       ( schema.number    (                )(100000          ),true                ); } );
test('CHECK string'    , ()=>{  assert.equal       ( schema.string    (                )("fooo"          ),true                ); } );
test('CHECK bigint'    , ()=>{  assert.equal       ( schema.bigint    (                )(BigInt(1)       ),true                ); } );
test('CHECK symbol'    , ()=>{  assert.equal       ( schema.symbol    (                )(Symbol('1')     ),true                ); } );
test('CHECK function'  , ()=>{  assert.equal       ( schema.function  (                )(()=>{}          ),true                ); } );
test('CHECK function'  , ()=>{  assert.equal       ( schema.function  (                )(function(){}    ),true                ); } );
test('CHECK function'  , ()=>{  assert.equal       ( schema.function  (                )(new Function('')),true                ); } );
test('CHECK not ERR'   , ()=>{  assert.throws      ( ()=>schema.not   (                )(                ), new RangeError( 'no definition was specified in `not`' )  ); } );
test('CHECK or ERR'    , ()=>{  assert.throws      ( ()=>schema.or    (                )(                ), new RangeError( 'no definition was specified in `or`' )  ); } );
test('CHECK and ERR'   , ()=>{  assert.throws      ( ()=>schema.and   (                )(                ), new RangeError( 'no definition was specified' )  ); } );
test('CHECK not OK'    , ()=>{  assert.doesNotThrow( ()=>schema.not   (schema.number() )(                ),  ); } );
test('CHECK or OK'     , ()=>{  assert.doesNotThrow( ()=>schema.or    (schema.number() )(                ),  ); } );
test('CHECK and OK'    , ()=>{  assert.doesNotThrow( ()=>schema.and   (schema.number() )(                ),  ); } );

/**
 * The primitive evaluators always return false when the given argument is
 * undefined or null, unless they are either undefined() or null().
 */
test( 'NULL CHECK ', ()=>{
  assert.equal( schema.undefined()( undefined  ), true  );
  assert.equal( schema.null()     ( undefined  ), false );
  assert.equal( schema.undefined()( null       ), false );
  assert.equal( schema.null()     ( null       ), true  );
  assert.equal( schema.boolean()  ( null       ), false );
  assert.equal( schema.number()   ( null       ), false );
  assert.equal( schema.string()   ( null       ), false );
  assert.equal( schema.bigint()   ( null       ), false );
  assert.equal( schema.symbol()   ( null       ), false );
  assert.equal( schema.function() ( null       ), false );
});

/**
 * test `not`
 */
test( 'CHECK2 not', ()=>{
  assert.equal( schema.not( schema.string())( false         ), true  );
  assert.equal( schema.not( schema.string())( "some string" ), false );
  assert.equal( schema.not( schema.string())( 12345 + 234   ), true  );
  assert.equal( schema.not( schema.string())( null          ), true  );
  assert.equal( schema.not( schema.string())( 1             ), true  );
  assert.equal( schema.not( schema.string())( BigInt(100)   ), true  );
});

test( 'CHECK2 or', ()=>{
  assert.equal( schema.or( schema.number(), schema.string()              )( false         ), false );
  assert.equal( schema.or( schema.number(), schema.string()              )( "some string" ), true  );
  assert.equal( schema.or( schema.number(), schema.string()              )( 12345 + 234   ), true  );
  assert.equal( schema.or( schema.number(), schema.string()              )( null          ), false );
  assert.equal( schema.or( schema.number(), schema.string(), schema.null() )( null          ), true  );
  assert.equal( schema.or( schema.number(), schema.string(), schema.null() )( 1             ), true  );
  assert.equal( schema.or( schema.number(), schema.string(), schema.null() )( BigInt(100)   ), false );
});

/*
 * test `and`
 *
 * Notice you should not find yourself to check if it is null or undefined
 * since all primitive evaluators return false when the argument is either
 * undefined or null.
 */
test( 'CHECK2 and', ()=>{
  assert.equal( schema.and( schema.undefined(), schema.not(schema.null()      ))( undefined      ),  true );
  assert.equal( schema.and( schema.null(),      schema.not(schema.undefined() ))( null           ),  true );
  assert.equal( schema.and( schema.boolean(),   schema.not(schema.null()      ))( false          ),  true );
  assert.equal( schema.and( schema.number(),    schema.not(schema.null()      ))( 10000          ),  true );
  assert.equal( schema.and( schema.string(),    schema.not(schema.null()      ))( "hello"        ),  true );
  assert.equal( schema.and( schema.bigint(),    schema.not(schema.null()      ))( BigInt(1)      ),  true );
  assert.equal( schema.and( schema.symbol(),    schema.not(schema.null()      ))( Symbol('foo')  ),  true );
  assert.equal( schema.and( schema.function(),  schema.not(schema.null()      ))( ()=>{}         ),  true );

  assert.equal( schema.and( schema.undefined(), schema.not(schema.null()      ))( null           ),  false );
  assert.equal( schema.and( schema.null(),      schema.not(schema.undefined() ))( undefined      ),  false );
  assert.equal( schema.and( schema.boolean(),   schema.not(schema.null()      ))( null           ),  false );
  assert.equal( schema.and( schema.number(),    schema.not(schema.null()      ))( null           ),  false );
  assert.equal( schema.and( schema.string(),    schema.not(schema.null()      ))( null           ),  false );
  assert.equal( schema.and( schema.bigint(),    schema.not(schema.null()      ))( null           ),  false );
  assert.equal( schema.and( schema.symbol(),    schema.not(schema.null()      ))( null           ),  false );
  assert.equal( schema.and( schema.function(),  schema.not(schema.null()      ))( null           ),  false );
});

test('CHECK Object',()=>{
  const def = schema.object({
    a:schema.boolean(),
    b:schema.number(),
  });
  assert.equal( def({ a:true, b:1,     }),  true  );
  assert.equal( def({ a:1,    b:1,     }),  false );
  assert.equal( def({ a:true, b:false, }),  false );
  assert.equal( def({ a:1   , b:false, }),  false );
});


test('CHECK ARRAY_OF',()=>{
  const def = schema.array_of(
    schema.number(),
  );
  assert.equal( def([0,         1,   2,       3,    4,    5]),  true  );
  assert.equal( def([0,         1,   2,   false,    4,    5]),  false );
  assert.equal( def([0,         1,   2,       3, "ff",    5]),  false );
  assert.equal( def([0, BigInt(1),   2,       3,    4,    5]),  false );
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

  assert.equal( factory.script , `
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
  assert.equal( schema.statement`string()`()(INFO) ,  'string()' );
  assert.equal( schema.statement`number()`()(INFO) ,  'number()' );

  assert.equal( schema.statement`string()`()('hello') ,  true  );
  assert.equal( schema.statement`string()`()( 123   ) ,  false );
  assert.equal( schema.statement`number()`()( 123   ) ,  true  );
  assert.equal( schema.statement`number()`()('hello') ,  false );
});

test('STATEMENT COMPILER INFO undefined'  , ()=>{  assert.equal( schema.statement`undefined ()`           ()(INFO        ), 'undefined()'          ); } );
test('STATEMENT COMPILER INFO null'       , ()=>{  assert.equal( schema.statement`null      ()`           ()(INFO        ), 'null()'               ); } );
test('STATEMENT COMPILER INFO boolean'    , ()=>{  assert.equal( schema.statement`boolean   ()`           ()(INFO        ), 'boolean()'            ); } );
test('STATEMENT COMPILER INFO number'     , ()=>{  assert.equal( schema.statement`number    ()`           ()(INFO        ), 'number()'             ); } );
test('STATEMENT COMPILER INFO string'     , ()=>{  assert.equal( schema.statement`string    ()`           ()(INFO        ), 'string()'             ); } );
test('STATEMENT COMPILER INFO bigint'     , ()=>{  assert.equal( schema.statement`bigint    ()`           ()(INFO        ), 'bigint()'             ); } );
test('STATEMENT COMPILER INFO symbol'     , ()=>{  assert.equal( schema.statement`symbol    ()`           ()(INFO        ), 'symbol()'             ); } );
test('STATEMENT COMPILER INFO function'   , ()=>{  assert.equal( schema.statement`function  ()`           ()(INFO        ), 'function()'           ); } );
test('STATEMENT COMPILER INFO not'        , ()=>{  assert.equal( schema.statement`not       (boolean())`  ()(INFO        ), 'not()'                ); } );
test('STATEMENT COMPILER INFO or'         , ()=>{  assert.equal( schema.statement`or        (boolean())`  ()(INFO        ), 'or()'                 ); } );
test('STATEMENT COMPILER INFO and'        , ()=>{  assert.equal( schema.statement`and       (boolean())`  ()(INFO        ), 'and()'                ); } );

test('STATEMENT COMPILER CHECK undefined' , ()=>{  assert.equal( schema.statement`undefined ()`           ()(undefined   ), true                 ); } );
test('STATEMENT COMPILER CHECK null'      , ()=>{  assert.equal( schema.statement`null      ()`           ()(null        ), true                 ); } );
test('STATEMENT COMPILER CHECK boolean 1' , ()=>{  assert.equal( schema.statement`boolean   ()`           ()(true        ), true                 ); } );
test('STATEMENT COMPILER CHECK boolean 2' , ()=>{  assert.equal( schema.statement`boolean   ()`           ()(false       ), true                 ); } );
test('STATEMENT COMPILER CHECK number'    , ()=>{  assert.equal( schema.statement`number    ()`           ()(100000      ), true                 ); } );
test('STATEMENT COMPILER CHECK string'    , ()=>{  assert.equal( schema.statement`string    ()`           ()("fooo"      ), true                 ); } );
test('STATEMENT COMPILER CHECK bigint'    , ()=>{  assert.equal( schema.statement`bigint    ()`           ()(BigInt(1)   ), true                 ); } );
test('STATEMENT COMPILER CHECK symbol'    , ()=>{  assert.equal( schema.statement`symbol    ()`           ()(Symbol('1') ), true                 ); } );
test('STATEMENT COMPILER CHECK function'  , ()=>{  assert.equal( schema.statement`function  ()`           ()(()=>{}      ), true                 ); } );
test('STATEMENT COMPILER CHECK not ERR'   , ()=>{  assert.throws( ()=>schema.statement`not   (           )`()(            ),  RangeError ); } );
test('STATEMENT COMPILER CHECK or ERR'    , ()=>{  assert.throws( ()=>schema.statement`or    (           )`()(            ),  RangeError ); } );
test('STATEMENT COMPILER CHECK and ERR'   , ()=>{  assert.throws( ()=>schema.statement`and   (           )`()(            ),  RangeError ); } );
test('STATEMENT COMPILER CHECK not OK'    , ()=>{  assert.doesNotThrow( ()=>schema.statement`not   (number()   )`()(            ), ); } );
test('STATEMENT COMPILER CHECK or OK'     , ()=>{  assert.doesNotThrow( ()=>schema.statement`or    (number()   )`()(            ), ); } );
test('STATEMENT COMPILER CHECK and OK'    , ()=>{  assert.doesNotThrow( ()=>schema.statement`and   (number()   )`()(            ), ); } );




/*
 * equals() and uuid()
 */

test('equals',()=>{
  assert.equal( schema.equals( 'hello' )( 'hello'    ) ,  true );
  assert.equal( schema.equals( 'hello' )( 'NO hello' ) ,  false );
  assert.equal( schema.equals( 123     )( '123'      ) ,  false );
  assert.equal( schema.equals( false   )( 'false'    ) ,  false );
  assert.equal( schema.equals( false   )( false      ) ,  true );
  assert.equal( schema.equals( null    )( undefined  ) ,  false );
  assert.equal( schema.equals( null    )( null       ) ,  true );
});

test('uuid',()=>{
  assert.equal( schema.uuid()( 'hello'    ) ,  false );
  assert.equal( schema.uuid()( 'NO hello' ) ,  false );
  assert.equal( schema.uuid()( '123'      ) ,  false );
  assert.equal( schema.uuid()( 'false'    ) ,  false );
  assert.equal( schema.uuid()( false      ) ,  false );
  assert.equal( schema.uuid()( undefined  ) ,  false );
  assert.equal( schema.uuid()( null       ) ,  false );
  assert.equal( schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e67' ) ,  true );
  assert.equal( schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7m37e67' ) ,  false );
  assert.equal( schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e677' ) ,  false );
  assert.equal( schema.uuid()( '2a945d9d-2cfb423b-afb2-362ea7c37e677' ) ,  false );

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
  assert.equal( 'hello' in rtti1 ,  true );
  assert.doesNotThrow( ()=>rtti1.statement`hello()`( value ) );

  // 2. clone again and confirm if the constructor `hello` is available on the
  //    second cloned object.
  const rtti2 = rtti1.clone();
  assert.equal( 'hello' in rtti2 ,  true );
  assert.doesNotThrow( ()=>rtti2.statement`hello()`( value ) );

  // 3.  confirm that setting `hello` does not affect to the original schema
  //     object.
  assert.equal( 'hello' in schema ,  false );
  assert.throws( ()=>schema.statement`hello()`( value ) );

  // 4.  set constructor `world to the second cloned object.
  rtti2.world = world;
  assert.equal( 'world' in rtti2 ,  true );
  assert.equal( 'world' in rtti1 ,  false );
  assert.doesNotThrow( ()=>rtti2.statement`world()`( value ) );
  assert.throws( ()=>rtti1.statement`world()`( value ) );
});



/*
 * any()
 */

test( 'ANY undefined'  , ()=>{ assert.equal( schema.any()( undefined       ), true); } );
test( 'ANY null'       , ()=>{ assert.equal( schema.any()( null            ), true); } );
test( 'ANY boolean'    , ()=>{ assert.equal( schema.any()( false           ), true); } );
test( 'ANY number'     , ()=>{ assert.equal( schema.any()( 1               ), true); } );
test( 'ANY string'     , ()=>{ assert.equal( schema.any()( '1'             ), true); } );
test( 'ANY bigint'     , ()=>{ assert.equal( schema.any()( BigInt(1)       ), true); } );
test( 'ANY symbol'     , ()=>{ assert.equal( schema.any()( Symbol.for('1') ), true); } );
test( 'ANY function'   , ()=>{ assert.equal( schema.any()( ()=>{}          ), true); } );



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

  assert.equal( factory.script , `
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

  assert.equal( factory.script , `
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
  assert.equal( factory.script , `schema.equals(10)`.trim());
  const vali = factory();
  console.error({factory,vali});
});

test('STATEMENT COMPILER JavaScript Blocks No.4', ()=>{
  const factory = schema.statement`number(<<>>)`;
  assert.equal( factory.script , `schema.number()`.trim());
  const vali = factory();
  console.error({factory,vali});
});


test('STATEMENT COMPILER JavaScript Blocks No.5', ()=>{
  const factory = schema.statement`number(<<1 + >><<2 + >><<3>>)`;
  assert.equal( factory.script , `schema.number(1 + 2 + 3)`.trim());
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
  assert.equal( rtti1.statement`hello()`()( v ) ,  false );

  // create namespace2.
  const rtti2 = schema.clone();

  // override `hello` as a different factory.
  rtti2.hello = make_vali_factory( ()=>(o)=>o === 'HELLO' );

  // `hello` should refer different factories depends on which namespace it is
  // called with.
  assert.equal( rtti1.statement`hello()`()( v ) ,  false );
  assert.equal( rtti2.statement`hello()`()( v ) ,  true );

  // this looks like it refers `rtti2.hello`
  const factory_by_rtti2 = rtti2.statement`hello()`;

  // set its namespace to `rtti1`
  rtti1.hello2 = factory_by_rtti2;

  // factory_by_rtti2 is called in the context of rtti1; this should refer
  // `rtti1.hello`; so this should be false.
  assert.equal( rtti1.hello2()( v ) ,  false ); 

  // if `factory_by_rtti2` is called without namespace, it refers the `rtti2`
  // where `factory_by_rtti2` comes from.
  assert.equal( factory_by_rtti2()( v ) ,  true ); 

});



test( 'ARRAY No.1', ()=>{
  const validator = schema.statement`
    array(
      equals( << 'a' >> ),
      equals( << 'b' >> ),
      equals( << 'c' >> ),
      )`();

  assert.equal( validator(['a','b','c']) ,  true );
  assert.equal( validator(['a','b','d']) ,  false );
  assert.equal( validator(['a','b','c', 'd' ]) ,  false );
  assert.equal( validator(['a','b'          ]) ,  false );

});



test( 'object with undefined No.1', ()=>{
  assert.equal( schema.statement`
    object(
      a: or(
        undefined(),
        string()
      )
    )`()(
      {
      }
    ),  true );
  assert.equal( schema.statement`
    object(
      a: string()
    )`()(
      {
      }
    ),  false );
});


// test( 'informative error message No.1 ', ()=>{
//   assert.equal( ()=>schema.statement`
//     object(
//       a: string
//     )`()(
//       {
//       }
//     ), (e)=>e.message === "the specified validator returned a function not a boolean in `object`; probably you forgot to call your factory generator?\n\n    schema.object({\n      a: schema.string\n    })" );
// });



test('STATEMENT COMPILER / returned validators have `script` property 1', ()=>{
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

  assert.equal( factory().script , `
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

  console.error({factory});
});


test('STATEMENT COMPILER / returned validators have `script` property 2', ()=>{
  const factory = schema.statement`   << (e)=>e===1>>   `;

  assert.equal( factory()( 1 ) ,  true );
  assert.equal( factory()( 2 ) ,  false );
  assert.equal( factory().script.trim() , `(e)=>e===1`);

  console.error({factory});
});



test('informative error message ...1 ', ()=>{
  const v = schema.array( schema.boolean(), schema.number(), schema.string() );
  console.error( v( INFO ) );
});

