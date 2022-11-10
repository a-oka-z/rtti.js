'use strict'

function inspect(s) {
  return JSON.stringify( s, null, 2 );
}






const RTTI   = Symbol.for( 'rtti.js' ); 
const INFO   = Symbol.for( 'dump rtti.js information' ); 
const mkrtti = 
  (chkArgs, infoGen, funcGen)=>(
    (...defs)=>{
      check_if_all_rtti_conformed(...defs);
      chkArgs(...defs);
      const func = funcGen(...defs);
      const info = infoGen(...defs);
      return (...args)=>args.length<1 ? info : 1<args.length ? RTTI : func(args[0]);
    }
  );
const check_if_rtti_conformed = (func, name='unknown')=>{
  if (! ( (typeof func === 'function') && (func(0,0,0)===RTTI ) )) {
    throw new TypeError( name + ' is not a non-rtti conformed object' );
  }
};
const check_if_all_rtti_conformed = (...defs)=>{
  return defs.every(
    arg=>Object.entries(arg).every(
      ([key,value])=>check_if_rtti_conformed( value, key )));
};

const rtti = {
  "undefined" : mkrtti((...def)=>{}, (...defs)=>"undefined", (...defs)=>(o)=>o === undefined         ),
  "null"      : mkrtti((...def)=>{}, (...defs)=>"null"     , (...defs)=>(o)=>o === null              ),
  "boolean"   : mkrtti((...def)=>{}, (...defs)=>"boolean"  , (...defs)=>(o)=>o !== undefined && o!==null && typeof o === "boolean"  ),
  "number"    : mkrtti((...def)=>{}, (...defs)=>"number"   , (...defs)=>(o)=>o !== undefined && o!==null && typeof o === "number"   ),
  "string"    : mkrtti((...def)=>{}, (...defs)=>"string"   , (...defs)=>(o)=>o !== undefined && o!==null && typeof o === "string"   ),
  "bigint"    : mkrtti((...def)=>{}, (...defs)=>"bigint"   , (...defs)=>(o)=>o !== undefined && o!==null && typeof o === "bigint"   ),
  "symbol"    : mkrtti((...def)=>{}, (...defs)=>"symbol"   , (...defs)=>(o)=>o !== undefined && o!==null && typeof o === "symbol"   ),
  "function"  : mkrtti((...def)=>{}, (...defs)=>"function" , (...defs)=>(o)=>o !== undefined && o!==null && typeof o === "function" ),
  "or"        : mkrtti(
    (...defs)=>{
      if (defs.length===0) {
        throw new RangeError( 'no definition was specified' );
      }
    }, 
    (...defs)=>"or",
    (...defs)=>(o)=>defs.some( f=>f(o))     
  ),
  "and"       : mkrtti(
    (...defs)=>{
      if (defs.length===0) {
        throw new RangeError( 'no definition was specified' );
      }
    }, 
    (...defs)=>"and"      ,
    (...defs)=>(o)=>defs.every(f=>f(o))     
  ),
  "not"       : mkrtti(
    (...defs)=>{
      if (defs.length < 1) {
        throw new RangeError( 'no definition was specified' );
      }
      if (1<defs.length) {
        throw new RangeError( 'too many definitions were specified' );
      }
    }, 
    (...defs)=>"not",
    (...defs)=>(o)=>! defs[0]( o ),
  ),
  "object"    : mkrtti(
    (...defs)=>{},
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
    }),
  "array"    : mkrtti(
    (...defs)=>{
      if ( ! defs.every(def=>( ( 'of' in def ) || typeof def.of === 'function' ))) {
        throw new TypeError( "'of' property was missing in the specified definition" );
      }
    },
    (...defs)=>{
      const def = defs.shift();
      return def.of(INFO) + '[]';
    },
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
            (def)=>o.every(e=>def.of(e)));
        }
      )
    }
  ),
};

 
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
  RTTI,
  INFO,
  mkrtti,
  rtti,
};