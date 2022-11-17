'use strict'

function inspect(s) {
  return JSON.stringify( s, null, 2 );
}





"use strict";

const INFO   = Symbol.for( 'dump rtti.js information' );
const ID_STANDARD_STATEMENT_COMPILER       = "compile";
const ID_STANDARD_STATEMENT_COMPILER_BOUND = "statement";

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
    return (o)=>o=== INFO ? info : vali(o);
  }
};

const makeValiFactory = make_vali_factory;

const is_proper_vali = (func, name='unknown')=>{
  try {
    return ( typeof func === 'function' ) && ( typeof func(false)==='boolean' );
  } catch (e){
    console.error('WARNING : is_proper_vali: detect error thrown and ignored it',e);
    return false;
  }
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
const joinStringsAndValues = ( strings, values )=>strings.map((s,i)=>(s + ((i in values ) ? values[i] : '' ) )  ).join('').trim();
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

function rttijs_clone() {
  const __rtti = new_namespace();
  Object.assign( __rtti, this );
  return __rtti;
}

function create_rttijs_standard_template_literal( do_bind ) {
  function rttijs_standard_template_literal(strings, ... values) {
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
    const PREFIX = 'rtti';

    const parenthesis_stack = [];

    let last_keyword = null;
    for ( let i=0; i<i_tokens.length; i++ ) {
      const curr_t = i_tokens[i];
      // if (curr_t.trim() !== '' ){ console.error( curr_t ) };
      if ( false ) {
      } else if ( curr_t === '(' ) {
        if (false) {
        } else if ( last_keyword === 'object' ) {
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
      try {
        return new Function( PREFIX , '...args' , 'return ' + script );
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
      if ( this === undefined ) {
        return compiled_script.apply( undefined, [ self, ...args ] );
      } else {
        return compiled_script.apply( undefined, [ this, ...args ] );
      }
    };

    // const result = do_bind ?  compiled_script.bind( this ) : compiled_script;
    result.script = script;
    result.bind_org = ()=>result;
    return result;
  };

  return rttijs_standard_template_literal;
}

const rttijs_standard_template_literal       = create_rttijs_standard_template_literal(false);
const rttijs_standard_template_literal_bound = create_rttijs_standard_template_literal(true);



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
        throw new RangeError( 'no definition was specified' );
      }
      if ( ! defs.every( e=>e !== null && e !==undefined && is_proper_vali( e ) ) ) {
        throw new TypeError( 'found an invalid argument' );
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
      if ( ! defs.every( e=>e !== null && e !==undefined && is_proper_vali( e ) ) ) {
        throw new TypeError( 'found an invalid argument' );
      }
    },
  ),
  "not"       : make_vali_factory(
    (...defs)=>(o)=>! defs[0]( o ),
    (...defs)=>"not",
    (...defs)=>{
      if (defs.length < 1) {
        throw new RangeError( 'no definition was specified' );
      }
      if (1<defs.length) {
        throw new RangeError( 'too many definitions were specified' );
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
      if ( ! defs.every(e=>( e!==null && e!==undefined && typeof e === 'object' && Object.values(e).every(ee=>is_proper_vali(ee))))) {
        throw new TypeError( 'found an invalid argument' );
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
      if ( ! defs.every(def=>(is_proper_vali( def )))) {
        throw new TypeError( "'of' property was missing or improperly set" );
      }
    }
  ),
  "equals"    : make_vali_factory(
    (val)=>(o)=>o === val,
    (val)=>val,
    (...defs)=>{
      if ( defs.length < 1 ) {
        throw new RangeError( 'no definition was specified' );
      }
    }
  ),
  "uuid"    : make_vali_factory(
    (...defs)=>(o)=>(typeof o ==='string') && (/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).test( o ),
    (...defs)=>"uuid",
    (...defs)=>{}
  ),
  [ID_STANDARD_STATEMENT_COMPILER]       : rttijs_standard_template_literal,
  [ID_STANDARD_STATEMENT_COMPILER_BOUND] : rttijs_standard_template_literal_bound,
  "clone" : rttijs_clone,
};





function new_namespace() {
  // Create a thunk for backward compatibility. This should create a normal
  // object.
  function rtti(...args) {
   /*
    * `rtti` is the reference to this function itself.  This functionality is
    * designed to accomplish recursive calls in closures. In this part, it
    * is applied as a closure which can be accessed from outside the
    * closure.
    */
    return rtti[ID_STANDARD_STATEMENT_COMPILER_BOUND].apply( rtti, args );
  }
  return rtti;
}


const rtti = (()=>{
  const __rtti = new_namespace();
  Object.assign( __rtti, standardValis );
  return __rtti;
})();


const newRtti = new_namespace;


// // console.error( rtti.null()() );
// console.error( rtti.null()(null) );
// console.error( rtti.null()(1) );
// console.error( rtti.string()(1) );
// console.error( rtti.or(rtti.number(), rtti.string())(false));
// console.error( rtti.or(rtti.boolean())(false));
// console.error( rtti.or(rtti.boolean())(1));
// console.error( rtti.object({
//   a:rtti.boolean(),
//   b:rtti.number(),
// })({
//   a:true,
//   b:1,
// }));
//
// console.error( rtti.object({
//   a:rtti.boolean(),
//   b:rtti.number(),
// })({
//   a:true,
//   b:true,
// }));
//
// console.error( rtti.object({
//   a:rtti.boolean(),
//   b:rtti.number(),
// })());
//
//
// console.error( rtti.array({ of: rtti.number() })());
// console.error( rtti.array({ of: rtti.array({ of: rtti.number() } )})());
// console.error( JSON.stringify( rtti.object({a: rtti.array({of:rtti.number()})})(), null,2));
// console.error( rtti.array({ of: rtti.number() })([1]));
// console.error( rtti.array({ of: rtti.number() })(["string"]));
// console.error( rtti.array({ of: rtti.array({ of: rtti.number() } )})([[1]]));
//



export {
  INFO,
  rtti,
  makeValiFactory,
  newRtti,
  standardValis,
};