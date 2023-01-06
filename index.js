const module_name = "vanilla-schema-validator";
const INFO = Symbol.for( 'dump schema information' );
const ID_STANDARD_STATEMENT_COMPILER  = "compiler";

const create_info_gen_from_string = ( info_gen_string )=>{
  if ( typeof info_gen_string === 'string' ) {
    return ()=>info_gen_string;
  } else {
    throw new TypeError('found an invalid argument');
  }
};

function make_vali_factory(
  vali_gen=(()=>{ throw new ReferenceError( 'vali_gen is not specified' ) } ), 
  info_gen=(function info_gen(...defs){ return "unknown" } ),
  chk_args=(function chk_args(...defs){ return null }) 
) {
  // console.log( 'make_vali_factory', this );
  if ( this !== undefined ) throw new Error("not undefined");

  if ( typeof info_gen === 'string' ) {
    info_gen = create_info_gen_from_string( info_gen );
  }

  return function validator(...defs) {
    chk_args.apply( this, defs );
    const vali = vali_gen.apply( this, defs );
    const info = info_gen.apply( this, defs );
    return (o)=>( o=== INFO ? info : vali(o) );
  }
};

const makeValiFactory = make_vali_factory;

const check_if_proper_vali = (func, name='unknown')=>{
  if ( func === null ) {
    throw new ReferenceError( `the specified validator was null in \`${name}\`` );
  } else if ( func === undefined ) {
    throw new ReferenceError( `the specified validator was null in \`${name}\`` );
  } else if ( typeof func !== `function` ) {
    throw new ReferenceError( `the specified validator was not a function in \`${name}\`` );
  } else {
    const result = func(false);
    if ( typeof result === 'function' ) {
      throw new TypeError( `the specified validator returned a function not a boolean in \`${name}\`; probably you forgot to call your factory generator?` );
    } else if ( typeof result !== 'boolean' ) {
      throw new TypeError( `the specified validator returned neither a boolean nor a function in \`${name}\`` );
    }
  }
  return true;
};


/*
 * example)
 *
 * object(
 *   name : string(),
 *   age  : number(),
 *   field : or( number(), string() ),
 *   attrs : object(
 *     foo: string(),
 *     bar: number(),
 *   )
 * )
 * TYPE = char*( PARAMS )
 * A_PARAM = char* ( : TYPE )
 * PARAMS = A_PARAM ( , PARAMS )
 *
 *
 */
const joinStringsAndValues = ( strings, values )=>strings.map((s,i)=>(s + ((i in values ) ? values[i] : '' ) )  ).join('');
const adjacent_token_is_colon = (tokens,idx)=>{
  for ( let i=idx;i<tokens.length; i++ ) {
    if ( tokens[i] === ':' ) {
      return i;
    } else if ( tokens[i].match (/\s+/ ) ){
      continue;
    } else {
      return -1;
    }
  }
  return -1;
};

function cloneSchema() {
  const schema = createSchema();
  Object.assign( schema, this );
  return schema;
}

function rttijs_standard_template_literal(strings, ... values) {
  if ( this === undefined )
    throw Error('this is undefined');

  if ( ! Array.isArray( strings ) ) {
    throw new TypeError( 'the first argument is not an array' );
  }
  if ( ! strings.every(e=>typeof e === 'string' ) )  {
    throw new TypeError( 'the array of the first argument contains a non-string value' );
  }

  const escaped_blocks = [];

  function escape_blocks( s ) {
    return s.replaceAll( /<<(.*?)>>/g, function(match,p1) {
      const c = escaped_blocks.length;
      const id = '__RTTIJS_ESCAPED_SEQUENCE_NO_' + ( c ) + '__';
      escaped_blocks.push( p1 );
      return id; 
    });
  }

  function unescape_blocks( input ) {
    let output = input;
    output = output.replaceAll( /__RTTIJS_ESCAPED_SEQUENCE_NO_([0-9]+)__/g, function(match,p1) {
      return escaped_blocks[p1];
    })
    return output;
  }

  const input  = 
    escape_blocks( 
      joinStringsAndValues( strings, values ));

  const i_tokens = Array.from( input.matchAll( /[(),:]|[a-zA-Z_][_a-zA-Z0-9]*|\s+/g ) ).map( e=>e[0] );
  const o_tokens = [ ...i_tokens ];
  const PREFIX = 'schema';

  const parenthesis_stack = [];

  let last_keyword = null;
  for ( let i=0; i<i_tokens.length; i++ ) {
    const curr_t = i_tokens[i];
    // if (curr_t.trim() !== '' ){ console.error( curr_t ) };
    if ( false ) {
    } else if ( curr_t === '(' ) {
      if (false) {
      } else if ( last_keyword === 'object' || last_keyword === 'define' ) {
        o_tokens[i] = '({';
        parenthesis_stack.push( '})' );
      } else  {
        parenthesis_stack.push( ')' );
      }

      last_keyword = null;
    } else if ( curr_t === ')' ) {
      o_tokens[i] = parenthesis_stack.pop();

      last_keyword = null;
    } else if ( curr_t === ',' ) {
      last_keyword = null;
    } else if ( curr_t === ':' ) {
      last_keyword = null;
    } else if ( curr_t.match( /\s+/ ) ) {
      // last_keyword = null;
    } else if ( /__RTTIJS_ESCAPED_SEQUENCE_NO_([0-9]+)__/.test( curr_t ) ) {
        // do nothing
        o_tokens[i] = o_tokens[i];
    } else {
      if ( adjacent_token_is_colon( i_tokens, i+1 )<0 ) {
        o_tokens[i] = PREFIX  + '.' + o_tokens[i] ;
      }
      last_keyword = i_tokens[i]; // is this proper? (Wed, 16 Nov 2022 17:28:53 +0900)
    }
  }

  const script = 
    unescape_blocks(
      o_tokens.join(''));

  /*
   * This is just for trapping errors; this simply returns the function.
   */
  const compiled_script = (()=>{
    let __script = script;
    __script = __script.trim();
    __script = __script.replace( /,$/, '' );

    try {
      return new Function( PREFIX , '...args' , 'return (\n' + __script + '\n);' );
    } catch (e) {
      throw new SyntaxError( e.message += '\n' + script, {cause:e} );
    }
  })();

  /*
   * Switch self/this depends on the context that the function is called.
   * For further information, see Atsushi Oka's daily on Nov 17 2022.
   */
  const self = this;
  const result = function compiled_statement(...args) {
    const schema = this == undefined ? self : this;
    try {
      const validator =  compiled_script.apply( undefined, [ schema, ...args ] );
      if ( validator !== undefined && 
           validator !== null      && 
          ( ( typeof validator === 'object'   ) || 
            ( typeof validator === 'function' ) ) )
      {
        Object.defineProperty( validator, 'script', {
          value : script,
          enumerable   : false,
          writable     : true,
          configurable : true,
        });
      }
      return validator;
    } catch (e) {
      e.message = 
        `[${module_name}] a compiled validator threw an error. '${e.message}'\ninformation:\nscript:${script}\n---\nschema:${JSON.stringify( schema, (k,v)=>typeof v==='function' ? '[function '+k+']' : v, 2)}\n---\n`;
      throw e;
      // throw new SyntaxError( 'an error was occured in a compiled `rtti.js` statement\n' + script,  {cause:e} );
    }
  };
  result.script = script;
  return result;
};


const standardValis = {
  "any"       : make_vali_factory((...defs)=>(o)=>true                                                   , (...defs)=>"any"      , (...def)=>{}),
  "undefined" : make_vali_factory((...defs)=>(o)=>typeof o === "undefined"                               , (...defs)=>"undefined", (...def)=>{}),
  "null"      : make_vali_factory((...defs)=>(o)=>o === null                                             , (...defs)=>"null"     , (...def)=>{}),
  "boolean"   : make_vali_factory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "boolean"  , (...defs)=>"boolean"  , (...def)=>{}),
  "number"    : make_vali_factory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "number"   , (...defs)=>"number"   , (...def)=>{}),
  "string"    : make_vali_factory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "string"   , (...defs)=>"string"   , (...def)=>{}),
  "bigint"    : make_vali_factory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "bigint"   , (...defs)=>"bigint"   , (...def)=>{}),
  "symbol"    : make_vali_factory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "symbol"   , (...defs)=>"symbol"   , (...def)=>{}),
  "function"  : make_vali_factory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "function" , (...defs)=>"function" , (...def)=>{}),
  "or"        : make_vali_factory(
    (...defs)=>(o)=>defs.some( f=>f(o)),
    (...defs)=>"or",
    (...defs)=>{
      if (defs.length===0) {
        throw new RangeError( 'no definition was specified in `or`' );
      }
      if ( ! defs.every( e=>check_if_proper_vali( e, 'or' ) ) ) {
        throw new TypeError( 'found an invalid argument in `or`' );
      }
    },
  ),
  "and"       : make_vali_factory(
    (...defs)=>(o)=>defs.every(f=>f(o)),
    (...defs)=>"and"      ,
    (...defs)=>{
      if (defs.length===0) {
        throw new RangeError( 'no definition was specified' );
      }
      if ( ! defs.every( e=>check_if_proper_vali( e, 'and' ) ) ) {
        throw new TypeError( 'found an invalid argument in `and`' );
      }
    },
  ),
  "not"       : make_vali_factory(
    (...defs)=>(o)=>! defs[0]( o ),
    (...defs)=>"not",
    (...defs)=>{
      if (defs.length < 1) {
        throw new RangeError( 'no definition was specified in `not`' );
      }
      if (1<defs.length) {
        throw new RangeError( 'too many definitions were specified in `not`' );
      }
    },
  ),
  "object"    : make_vali_factory(
    (...defs)=>{
      return (
        (o)=>{
          if ( o === null || o === undefined ) {
            return false;
          }
          if ( typeof o !== 'object' ) {
            return false;
          }
          return defs.every(
            def=>Object.entries(def).every(
              ([key,value])=>value( o[key])))
        }
      )
    },
    (...defs)=>{
      return defs.reduce(
        (accum,arg)=>({
          ...accum,
          ...(Object.entries(arg).reduce(
            (accum,[key,value])=>({
              ...accum,
              [key]: value(INFO),
            })
            ,{}))
        })
        ,{})
    },
    (...defs)=>{
      if ( ! defs.every(e=>( e!==null && e!==undefined && typeof e === 'object' && Object.values(e).every(ee=>check_if_proper_vali(ee,'object'))))) {
        throw new TypeError( 'found an invalid argument in `object`' );
      }
    }
  ),
  "array_of"    : make_vali_factory(
    (...defs)=>{
      return (
        (o)=>{
          if ( o === null || o === undefined ) {
            return false;
          }
          if ( ! Array.isArray( o ) ) {
            return false;
          }
          return defs.every(
            (def)=>o.every(e=>def(e)));
        }
      )
    },
    (...defs)=>{
      const def = defs.shift();
      return def(INFO) + '[]';
    },
    (...defs)=>{
      if ( ! defs.every(def=>(check_if_proper_vali( def,'array_of' )))) {
        throw new TypeError( "found an invalid argument `array_of`" );
      }
    }
  ),
  "array"    : make_vali_factory(
    (...defs)=>{
      return (
        (o)=>{
          if ( o === null || o === undefined ) {
            return false;
          }
          if ( ! Array.isArray( o ) ) {
            return false;
          }
          if ( o.length != defs.length ) {
            return false;
          }
          return defs.every( (def,i)=>def( o[i] ) );
        }
      )
    },
    (...defs)=>{
      if ( defs.length === 0 ) {
        return '[empty array]';
      } else {
        const def = defs.shift();
        return def(INFO) + '[]';
      }
    },
    (...defs)=>{
      if ( ! defs.every(def=>(check_if_proper_vali( def, 'array' )))) {
        throw new TypeError( "found an invalid argument `array`" );
      }
    }
  ),
  "equals"    : make_vali_factory(
    (val)=>(o)=>o === val,
    (val)=>val,
    (...defs)=>{
      if ( defs.length < 1 ) {
        throw new RangeError( 'no definition was specified in `equals`' );
      }
    }
  ),
  "uuid"    : make_vali_factory(
    (...defs)=>(o)=>(typeof o ==='string') && (/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).test( o ),
    (...defs)=>"uuid",
    (...defs)=>{}
  ),

  [ID_STANDARD_STATEMENT_COMPILER]       : rttijs_standard_template_literal,
  "statement" : function statement(...args) {
    return this[ID_STANDARD_STATEMENT_COMPILER].call(this,...args);
  },

  "compile" : function compile(...args) {
    return this[ID_STANDARD_STATEMENT_COMPILER].call(this,...args);
  },

  "define"  : function define(object) {
    if ( this === undefined ) {
      throw new ReferenceError( '`define` function cannot be executed without `this`' );
    } 
    if ( typeof object !== 'object' ) {
      throw new TypeError( 'the first argument must be an object' );
    }
    Object.entries( object ).forEach(([key,value])=>{
      if ( typeof key !== 'string' ) {
        throw new TypeError( 'the first argument must be a string value' );
      }
      if ( typeof value !== 'function' ) {
        throw new TypeError( 'the second argument must be a function' );
      }
      this[ key ] = make_vali_factory( (...defs)=>value, (...defs)=>key, (...defs)=>{} );
    });
  },
  "clone" : cloneSchema,
};



function createSchema() {
  return {};
}

const schema = (()=>{
  const schema = createSchema();
  Object.assign( schema, standardValis );
  return schema;
})();


const newRtti = createSchema;


// // console.error( schema.null()() );
// console.error( schema.null()(null) );
// console.error( schema.null()(1) );
// console.error( schema.string()(1) );
// console.error( schema.or(schema.number(), schema.string())(false));
// console.error( schema.or(schema.boolean())(false));
// console.error( schema.or(schema.boolean())(1));
// console.error( schema.object({
//   a:schema.boolean(),
//   b:schema.number(),
// })({
//   a:true,
//   b:1,
// }));
//
// console.error( schema.object({
//   a:schema.boolean(),
//   b:schema.number(),
// })({
//   a:true,
//   b:true,
// }));
//
// console.error( schema.object({
//   a:schema.boolean(),
//   b:schema.number(),
// })());
//
//
// console.error( schema.array_of({ of: schema.number() })());
// console.error( schema.array_of({ of: schema.array_of({ of: schema.number() } )})());
// console.error( JSON.stringify( schema.object({a: schema.array_of({of:schema.number()})})(), null,2));
// console.error( schema.array_of({ of: schema.number() })([1]));
// console.error( schema.array_of({ of: schema.number() })(["string"]));
// console.error( schema.array_of({ of: schema.array_of({ of: schema.number() } )})([[1]]));
//
