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

const mk_vali_factory = ( vali_gen, info_gen=(...defs)=>"unknown", chk_args=(...defs)=>{} )=>{
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
 
const rtti = {
  "undefined" : mk_vali_factory((...defs)=>(o)=>o === undefined                                        , (...defs)=>"undefined", (...def)=>{}),
  "null"      : mk_vali_factory((...defs)=>(o)=>o === null                                             , (...defs)=>"null"     , (...def)=>{}),
  "boolean"   : mk_vali_factory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "boolean"  , (...defs)=>"boolean"  , (...def)=>{}),
  "number"    : mk_vali_factory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "number"   , (...defs)=>"number"   , (...def)=>{}),
  "string"    : mk_vali_factory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "string"   , (...defs)=>"string"   , (...def)=>{}),
  "bigint"    : mk_vali_factory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "bigint"   , (...defs)=>"bigint"   , (...def)=>{}),
  "symbol"    : mk_vali_factory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "symbol"   , (...defs)=>"symbol"   , (...def)=>{}),
  "function"  : mk_vali_factory((...defs)=>(o)=>o !== undefined && o!==null && typeof o === "function" , (...defs)=>"function" , (...def)=>{}),
  "or"        : mk_vali_factory(
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
  "and"       : mk_vali_factory(
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
  "not"       : mk_vali_factory(
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
  "object"    : mk_vali_factory(
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
  "array"    : mk_vali_factory(
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
    },
    (...defs)=>{
      const def = defs.shift();
      return def.of(INFO) + '[]';
    },
    (...defs)=>{
      if ( ! defs.every(def=>(typeof def==='object') && ( 'of' in def ) && (is_proper_vali( def.of )))) {
        throw new TypeError( "'of' property was missing or improperly set" );
      }
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
  INFO,
  mk_vali_factory,
  rtti,
};