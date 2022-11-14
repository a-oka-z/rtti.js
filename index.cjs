'use strict'

function inspect(s) {
  return JSON.stringify( s, null, 2 );
}






const INFO   = Symbol.for( 'dump rtti.js information' ); 
const create_info_gen_from_string = ( info_gen_string )=>{
  if ( typeof info_gen_string === 'string' ) {
    return ()=>info_gen_string;
  } else {
    throw new TypeError('found an invalid argument');
  }
};

const makeValiFactory = ( vali_gen, info_gen=(...defs)=>"unknown", chk_args=(...defs)=>{} )=>{
  if ( typeof info_gen === 'string' ) {
    info_gen = create_info_gen_from_string( info_gen );
  }
  return (...defs)=>{
    chk_args(...defs);
    const vali = vali_gen(...defs);
    const info = info_gen(...defs);
    return (o)=>o=== INFO ? info : vali(o);
  }
};
const is_proper_vali = (func, name='unknown')=>{
  try {
    return ( typeof func === 'function' ) && ( typeof func(false)==='boolean' );
  } catch (e){
    console.error('WARNING : is_proper_vali: detect error thrown and ignored it',e);
    return false;
  }
};
 
const standardValis = {
  "undefined" : makeValiFactory((...defs)=>(o)=>o === undefined                                        , (...defs)=>"undefined", (...def)=>{}),
  "null"      : makeValiFactory((...defs)=>(o)=>o === null                                             , (...defs)=>"null"     , (...def)=>{}),
  "boolean"   : makeValiFactory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "boolean"  , (...defs)=>"boolean"  , (...def)=>{}),
  "number"    : makeValiFactory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "number"   , (...defs)=>"number"   , (...def)=>{}),
  "string"    : makeValiFactory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "string"   , (...defs)=>"string"   , (...def)=>{}),
  "bigint"    : makeValiFactory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "bigint"   , (...defs)=>"bigint"   , (...def)=>{}),
  "symbol"    : makeValiFactory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "symbol"   , (...defs)=>"symbol"   , (...def)=>{}),
  "function"  : makeValiFactory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "function" , (...defs)=>"function" , (...def)=>{}),
  "or"        : makeValiFactory(
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
  "and"       : makeValiFactory(
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
  "not"       : makeValiFactory(
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
  "object"    : makeValiFactory(
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
  "array"    : makeValiFactory(
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

function newRtti() {
  return function rttijs_template_literal(strings, ... values) {
    const input  = joinStringsAndValues( strings, values );
    const i_tokens = Array.from( input.matchAll( /[(),:]|[a-zA-Z_][_a-zA-Z0-9]*|\s+/g ) ).map( e=>e[0] );
    const o_tokens = [ ...i_tokens ];
    const prefix = 'rtti.';

    const parenthesis_stack = [];

    let last_keyword = null;
    for ( let i=0; i<i_tokens.length; i++ ) {
      const curr_t = i_tokens[i];
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
      } else {
        if ( adjacent_token_is_colon( i_tokens, i+1 )<0 ) {
          o_tokens[i] = prefix + o_tokens[i] ;
        }
        last_keyword = i_tokens[i];
      }
    }

    const script = o_tokens.join('');
    const compiled_script = (()=>{
      try {
        return new Function( 'rtti', 'return ' + script);;
      } catch (e) {
        throw new SyntaxError( e.message += '\n' + script, {cause:e} );
      }
    })();

    const result = (...args)=>{
      /* 
       * This is the reference to this function itself.  This functionarity is
       * designed to accomplish recursive calls in closures. In this part, it
       * is applied as a closure which can be accessed from outside the
       * closure.
       */
      return compiled_script(rttijs_template_literal,...args);
    };

    result.script = script;
    return result;
  }
}


const rtti = (()=>{
  const __rtti = newRtti();
  Object.assign( __rtti, standardValis ); 
  return __rtti;
})();





 
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



module.exports.INFO            = INFO;
module.exports.rtti            = rtti;
module.exports.makeValiFactory = makeValiFactory;
module.exports.newRtti  = newRtti;
module.exports.standardValis   = standardValis;