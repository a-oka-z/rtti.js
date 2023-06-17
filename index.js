const module_name = "vanilla-schema-validator";
const INFO = Symbol.for( 'dump schema information' );

const SCHEMA_VALIDATOR_COMPILE  = "vanilla-schema-validator.standard.compile";
const SCHEMA_VALIDATOR_DEFINE  = "vanilla-schema-validator.standard.define";
const SCHEMA_VALIDATOR_CURRENT_COMPILE  = "vanilla-schema-validator.compile";
const SCHEMA_VALIDATOR_CURRENT_DEFINE  = "vanilla-schema-validator.define";

const SCHEMA_VALIDATOR_SOURCE = Symbol.for( 'vanilla-schema-validator.source' );
const SCHEMA_VALIDATOR_FACTORY_NAME   = 'factory_name' ;
const SCHEMA_VALIDATOR_NAME = 'validator_name';



/*
 * (Thu, 16 Feb 2023 18:54:50 +0900)
 *
 * When a factory names a validator , the name should be taken as both a
 * facotry name and as a validator name. And the factory name is immutable so
 * that it cannot be modified. When a user renames a validator, it only changes
 * its validator name and its validator factory name will not be changed.
 */
const name_validator   = (factory_name,validator)=>{
  Object.defineProperties( validator, {
    [SCHEMA_VALIDATOR_FACTORY_NAME]: {
      value : factory_name,
      enumerable : true,
      writable : true,
      configurable : true,
    },
    [SCHEMA_VALIDATOR_NAME]: {
      value : factory_name,
      enumerable : true,
      writable : true,
      configurable : true,
    },
  });
  return validator;
};

const rename_validator = (factory_name,validator)=>{
  Object.defineProperties( validator, {
    [SCHEMA_VALIDATOR_NAME]: {
      value : factory_name,
      enumerable : true,
      writable : true,
      configurable : true,
    },
  });
  return validator;
};

const path_to_str = (p,show_value)=>{
  if ( show_value ) {
    return `->{${p.id}:${vali_to_str(p.validator)}} === ${bool_to_str(p.value)}`;
  } else {
    return `->{${p.id}:${vali_to_str(p.validator)}}`;
  }
};
const vali_to_str = (v)=>{
  if ( SCHEMA_VALIDATOR_NAME in v ) {
    return v[SCHEMA_VALIDATOR_NAME];
  } else if ( 'name' in v ) {
    return v.name;
  } else {
    return '?';
  }
};

const bool_to_str = (v)=>{
  if ( v === null ) {
    return '0';
  } else if ( v ) {
    return 't';
  } else {
    return 'f';
  }
};

/*
 * SchemaValidatorContext : object(
 *   // this stores the current path elements
 *   path_stack : array_of(
 *     object(
 *       id : string(),
 *       validator : function(),
 *       value : boolean(),
 *     )
 *   ),
 *
 *   // this stores these snapshots of `path_stack`
 *   // which are created when `notify()` is called.
 *   notified_values : array_of(
 *     1t_path_stack(),
 *   ),
 *
 *   // the final result
 *   value : or( null(), boolean() ),
 * ),
 */
class SchemaValidatorContext {
  constructor(...args) {
    this.path_stack = [];
    this.notified_values = [];
    this.value = null;
  }
  enter( id, validator ) {
    this.path_stack.push({
      id,
      validator,
      value : null,
    });
  }
  notify( value ) {
    if ( typeof value !== 'boolean' ) {
      throw new TypeError( `notified an invalid value : ${value}` );
    }
    if ( this.path_stack.length < 1 ) {
      throw new RangeError( `stack undeflow error` );
    }
    const path_elem = this.path_stack[ this.path_stack.length -1 ];
    if ( path_elem.value !== null ) {
      throw new RangeError( `error: notify() has already been called` );
    }
    path_elem.value = value;
    this.notified_values.push( [ ...(this.path_stack) ] );
    this.value = value;
    return value;
  }
  leave() {
    return this.path_stack.pop();
  }
  report() {
    return this.notified_values.map( e=>( e.map( (ee,idx,arr)=>'  ' + path_to_str(ee,arr.length-1===idx) ).join('') ) ).join('\n');
  }
  toString() {
    return this.report();
  }
  [Symbol.for('nodejs.util.inspect.custom')](depth, inspectOptions, inspect) {
    return `\n${this.report()}`;
  }
}

class NullSchemaValidatorContext {
  enter(){}
  notify(value){ return value;}
  leave(){}
  result() { return [] }
  toString() { return '' }
};
const null_context = new NullSchemaValidatorContext();

const trace_validator = ( validator, value )=>{
  const context = new SchemaValidatorContext();
  try {
    context.enter( 'begin', validator );
    const result = context.notify( validator( value, context ) );
    return context;
  } finally {
    context.leave();
  }
};

class TypeCastError extends TypeError {
  constructor(...args){
    super(...args);
  }
}

const typecast = ( validator, value )=>{
  const context = trace_validator( validator, value );
  if ( ! context.value ) {
    throw new TypeCastError(
      'an invalid type:\nthe value (' +
      inspect( value ) +
      ") does not conform to the type:\n" +
      vali_to_str( value ) + "\n" +
      context.report() );
  }
  return value;
};

const typeassert = (...args)=>{
  try {
    return typecast( ...args );
  } catch ( e ){
    console.error( e );
  }
};

function vali_to_string( vali ) {
  if ( typeof vali !== 'function' ) {
    throw new TypeError( 'vali is not a function' );
  }

  try {
    const result = vali( INFO );
    if ( typeof result !== 'boolean' ) {
      return result;
    }
  } catch (e) {
    console.error(e);
    // safely ignorable
  }

  if ( 'source' in vali ) {
    return vali.source;
  } else if ( 'script' in vali ) {
    return vali.script;
  } else {
    return Function.prototype.toString.call( vali );
  }
}

const check_if_proper_vali = func=>{
  if ( func === null ) {
    return 'null';
  } else if ( func === undefined ) {
    return 'undefined';
  } else if ( typeof func !== `function` ) {
    return 'not a function';
  } else {
    const result = func( false );
    if ( typeof result === 'function' ) {
      return 'a validator that returns a function not a boolean; probably you forgot to call your validator factory.';
    } else if ( typeof result !== 'boolean' ) {
      return 'a validator returned neither a boolean nor a function';
    }
  }
  return null;
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
 *
 * id        = [a-zA-Z0-9]+
 * validator = id
 * factory   = id( PARAMS )
 * valifac   =  ( validator-name : ) factory
 * PARAMS    = valifac ( , PARAMS )
 *
 * schema    = valifac
 *
 */
const join_strings_and_values = ( strings, values )=>strings.map((s,i)=>(s + ((i in values ) ? values[i] : '' ) )  ).join('');

function __parse(input) {
  class CompileError extends Error {
    constructor(...args) {
      const arg = Object.assign({},...args);
      super(args.message, args);
      Object.assign( this, arg );
    }
  }
  const escaped_blocks = [];

  function escape_blocks( s ) {
    return s.replaceAll( /<<(.*?)>>/g, function(match,p1) {
      const c = escaped_blocks.length;
      const id = 't__static_value_' + ( c ) + '_interpolator';
      escaped_blocks.push({
        key : id,
        value: p1,
      });
      return id + '()';
    });
  }

  function remove_line_comment( s ) {
    return s.replaceAll( /\/\/.*$/gm, function (match) {
      return ' ';
    });
  }

  function remove_block_comment( s ) {
    return s.replaceAll( /\/\*[\s\S]*\*\//gm, function (match) {
      return ' ';
    });
  }

  function check_all_valid_chars( s ) {
    const regexp = /[^\$a-zA-Z0-9_:,\(\)\s]/gm;
    return s.replaceAll(regexp , function (match,offset,string,groups) {
      throw new CompileError({message: `invalid character '${ match }' in character ${ offset }\n${s}` });
    });
  }

  const KWD = '@'; // t_validator_type
  const BGN = '('; // (
  const END = ')'; // )
  const PSP = ','; // , ... comma / parameter separator
  const KSP = ';'; // ; ... colon / key-value separator


  const modified_input =
    check_all_valid_chars(
      remove_block_comment(
        remove_line_comment(
          escape_blocks( input  ))));

  class Token {
    constructor({type,value,src}) {
      if ( type === null || type === undefined ) {
        throw new ReferenceError( 'type was not specified' );
      }
      if ( value === null || value === undefined ) {
        throw new ReferenceError( 'value was not specified' );
      }
      if ( typeof type  !== 'string' ) {
        throw new TypeError( 'invalid type of `type`' );
      }
      if ( typeof value  !== 'string' ) {
        throw new TypeError( 'invalid type of `value`' );
      }
      this.type = type;
      this.value = value;
      this.src = src;
    }
  }

  //                2                 3     4     5     6
  const pattern = /(([0-9a-zA-Z\$_]+)|([(])|([)])|([,])|([:]))/g;
  const tokens = [];
  for(;;) {
    const m = pattern.exec( modified_input );
    if ( ! m ) {
      break;
    }
    if ( false ) {
    } else if ( typeof m[2] === 'string' ) {
      tokens.push( new Token({
        type : KWD,
        value : m[2],
        src :{
          position: m.index,
        },
      }));
    } else if ( typeof m[3] === 'string' ) {
      tokens.push( new Token({
        type : BGN,
        value : m[3],
        src :{
          position: m.index,
        },
      }));
    } else if ( typeof m[4] === 'string' ) {
      tokens.push( new Token({
        type : END,
        value : m[4],
        src :{
          position: m.index,
        },
      }));
    } else if ( typeof m[5] === 'string' ) {
      tokens.push( new Token({
        type : PSP,
        value : m[5],
        src :{
          position: m.index,
        },
      }));
    } else if ( typeof m[6] === 'string' ) {
      tokens.push( new Token({
        type : KSP,
        value : m[6],
        src :{
          position: m.index,
        },
      }));
    } else {
      throw new CompileError({message:'internal error ' + input });
    }
  }

  class Elem {
    constructor(token) {
      this.token  = token;
      this.token_at_end = null;
      this.val_id = null;
      this.fac_id = null;
      this.children = [];
      this.is_closed_element = false;
    }
    range() {
      const s = this.token       ?.src?.position ?? null;
      const e = this.token_at_end?.src?.position ?? null;
      if ( s !== null && e !== null ) {
        return [s,e];
      } else {
        return null;
      }
    }
  }

  {
    let elem_stack = [ new Elem(null) ];
    let work_elem = null;

    /*
     * Notify the end of the current element.
     * There are two posibillities that ends the current element :
     *   1. an end of a pair of parenthesis
     *   2. a parameter separator  ( comma )
     * See the code bellow.
     */
    const notify_end_of_elem = (work_elem,current_token)=>{
      if ( work_elem !== null ) {
        work_elem.token_at_end = current_token;
      }
    };

    for ( const current_token of tokens ) {
      switch ( current_token.type ) {
        case KWD : {

          if ( work_elem === null ) {
            // begin a new definition
            work_elem = new Elem( current_token );
            elem_stack[ elem_stack.length-1].children.push( work_elem );
          }

          if ( work_elem.fac_id !== null ) {
            if ( work_elem.val_id === null ) {
              throw new CompileError({message: 'missing colon' });
            } else {
              throw new CompileError({message: 'missing comma' });
            }
          }

          work_elem.fac_id = current_token.value;

          break;
        };

        case BGN : {
          if ( work_elem === null ) {
            throw new CompileError({message: 'expected a keyword but missing' });
          }
          if ( work_elem.is_closed_element !== false ) {
            throw new CompileError({message: `expected ')' or a new keyword but missing` });
          }
          elem_stack.push( work_elem );
          work_elem = null;

          break;
        };

        case END : {
          if ( work_elem === null ) {
            // This can be safely ignored.
            // throw new CompileError({message: 'expected a keyword but missing' });
          }
          if ( elem_stack.length <= 0 ) {
            throw new CompileError({message: 'an unmatched parenthes' });
          }

          notify_end_of_elem( work_elem, current_token );

          work_elem = elem_stack.pop();
          work_elem.is_closed_element = true;

          break;
        };

        case PSP : {
          if( work_elem === null ) {
            throw new CompileError({message: 'missing keyword' });
          }

          // Notify the end of the current element.
          notify_end_of_elem( work_elem, current_token );

          work_elem = null;

          break;
        };

        case KSP : {
          if ( work_elem === null ) {
            throw new CompileError({message: 'no validator was specified' });
          }
          if ( work_elem.fac_id === null ) {
            throw new CompileError({message:'no factory was specified' });
          }
          if ( work_elem.val_id !== null ) {
            throw new CompileError({message:'duplicate colon error' });
          }
          work_elem.val_id = work_elem.fac_id;
          work_elem.fac_id = null;

          break;
        };
        default : {
          throw new CompileError({message: 'internal error ' + input });
        };
      }
    }
    notify_end_of_elem( work_elem, 0<tokens.length ? tokens[ tokens.length -1 ] : null );

    if (  elem_stack.length !== 1 ) {
      throw new CompileError({ message:'probably found an unmatched parenthesis' });
    }

    const parsed = {
      source : input,
      tokens,
      modified_source : modified_input,
      definitions : [...elem_stack.shift().children ],
      escaped_blocks,
    };

    return parsed;
  }
}

function get_source( input, elem ){
  const r = elem.range();
  if ( r === null ) {
    return 'no source';
  } else {
    return '`' + input.substring( r[0], r[1] + 1 ).replaceAll( /[`]/gm, '\\`' ) + '`';
  }
}

function __compile( parsed ) {
  const compiled_buf = [];
  const output = (...args)=>compiled_buf.push(...args);
  const remove_last_comma = ()=>{
    const i = compiled_buf.length -1;
    compiled_buf[ i ] = compiled_buf[ i ].replaceAll( /,\s*$/gm ,'' );
  }

  output( '"use strict";' );
  output( 'const self=this;' );
  const check_escaped_block = (s)=>{
    s=s.trim();
    if ( s.trim() === '' ) {
      return 'undefined';
    } else {
      return s;
    }
  };
  for ( const {key,value} of parsed.escaped_blocks ) {

    output( `const ${key} = ()=>(${check_escaped_block(value)});` );
  }

  function output_elem( parent_elem, elem, indent_level ) {
    const indent  = " ".repeat( (indent_level + 4 ) * 2 );
    const {
      paren_b,
      paren_e
    } = elem.fac_id === 'object' ? {
      paren_b : '{',
      paren_e : '}',
    } : {
      paren_b : '',
      paren_e : '',
    };

    const schema_name = elem.fac_id.match( /^t__static_value_[0-9]_interpolator$/ ) ? '' : 'schema.';

    // Omit to output validator id on the first indent level.  The first indent
    // level should be treated specially because  it should be enclosed by a
    // function call. If it is without the enclosing, it would be implemented
    // symmetrically.
    if ( indent_level === 0 ) {
      output( indent +                                        `${schema_name}${elem.fac_id}(${paren_b}` );
    } else {
      // >>> MODIFIED ON (Sat, 03 Jun 2023 14:35:24 +0900)
      // >>> omit output val_id when the parent factory id is not an object.
      const tmp_val_id = parent_elem.fac_id === 'object' ? elem.val_id : null;
      output( indent + `${tmp_val_id ? tmp_val_id +':' : '' }${schema_name}${elem.fac_id}(${paren_b}` );
      // <<< MODIFIED ON (Sat, 03 Jun 2023 14:35:24 +0900)
    }
    for ( const sub_elem of elem.children ) {
      output_elem( elem, sub_elem, indent_level + 1 );
    }
    remove_last_comma();
    output( indent + `${paren_e}),` );
  }

  output( 'const result = ({' );
  let type_name = null;
  for ( const elem of parsed.definitions ) {
    type_name = elem.val_id ?? 't_anonymous';

    output( `  "${type_name}" : (function ${type_name}(...args) {` );
    output( `    const schema = this === undefined ? self : this;` );
    output( `    try {` );
    output( `      const validator = schema.thru(` );

    output_elem( null, elem, 0 );
    remove_last_comma();

    output( `      );` );
    output( `      Object.defineProperties(validator,{` );
    output( `        "${SCHEMA_VALIDATOR_NAME}" : {`);
    output( `          value : "${type_name}", `);
    output( `          enumerable   : false,   `);
    output( `          writable     : false,   `);
    output( `          configurable : true,    `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_FACTORY_NAME}" : {`);
    output( `          value : "${type_name}", `);
    output( `          enumerable   : false,   `);
    output( `          writable     : false,   `);
    output( `          configurable : true,    `);
    output( `        },`);
    output( `        "toString" : {`);
    output( `          value : ()=>${get_source(parsed.source, elem)} , `);
    output( `          enumerable   : false,   `);
    output( `          writable     : false,   `);
    output( `          configurable : true,    `);
    output( `        },`);
    output( `      });` );
    output( `      return validator;` );
    output( `    } catch ( e ) {` );
    output( `      e.source = ${type_name}.toString();` );
    output( `      e.schema = schema;` );
    output( `      throw e;` );
    output( `    }` );
    output( `  }),` );
  }
  output('});' );
  if ( type_name !== null ) {
    output( `result.t_default = result.${type_name};` );
  }
  output( `return result;` );

  const clean_source = (s)=>{
    return s.replaceAll( /\(\s*\)/gm, '()' );
  };

  const compiled_source = clean_source( compiled_buf.join('\n')) ;
  let factory_factory = null;
  try {
    factory_factory = new Function( compiled_source );
  } catch (e){
    e.message += ' in\n---\n' + compiled_source.replaceAll( /^/gm, ' '.repeat(4) ) + '\n---\n';
    e.source = compiled_source;
    throw e;
  }
  return {
    ...parsed,
    compiled_buf,
    compiled_source,
    factory_factory,
  };
}

function schema_validator_script_compiler( input ) {
  const parsed   = __parse( input  );
  const compiled = __compile( parsed );
  return compiled;
}

function schema_validator_template_literal_compile( strings, ... values ) {
  if ( this === undefined )
    throw Error('this is undefined');
  if ( ! Array.isArray( strings ) ) {
    throw new TypeError( 'the first argument is not an array' );
  }
  if ( ! strings.every(e=>typeof e === 'string' ) )  {
    throw new TypeError( 'the array of the first argument contains a non-string value' );
  }

  const input = join_strings_and_values( strings, values );
  const compiled = schema_validator_script_compiler( input );
  const result   = compiled.factory_factory.call( this );

  // console.log( 'compiled_buf', compiled.compiled_buf.join('\n') );
  // console.log( 'decompiled',   result.t_default.toString() );

  return result.t_default;
}

function schema_validator_template_literal_define( strings, ... values ) {
  if ( this === undefined )
    throw Error('this is undefined');
  if ( ! Array.isArray( strings ) ) {
    throw new TypeError( 'the first argument is not an array' );
  }
  if ( ! strings.every(e=>typeof e === 'string' ) )  {
    throw new TypeError( 'the array of the first argument contains a non-string value' );
  }

  const input = join_strings_and_values( strings, values );
  const compiled = schema_validator_script_compiler( input );
  const result   = compiled.factory_factory.call( this );

  // console.log( 'compiled_buf', compiled.compiled_buf.join('\n') );
  Object.assign( this, result );
  return result;
}




function cloneSchema() {
  const schema = createSchema();
  Object.assign( schema, this );
  return schema;
}


const standardValis = {
  "any"       : (...defs)=>name_validator("any"      ,(o)=>true ),
  "undefined" : (...defs)=>name_validator("undefined",(o)=>typeof o === "undefined"),
  "null"      : (...defs)=>name_validator("null"     ,(o)=>o === null ),
  "boolean"   : (...defs)=>name_validator("boolean"  ,(o)=>o !== undefined && o!==null && typeof o === "boolean" ),
  "number"    : (...defs)=>name_validator("number"   ,(o)=>o !== undefined && o!==null && typeof o === "number"  ),
  "string"    : (...defs)=>name_validator("string"   ,(o)=>o !== undefined && o!==null && typeof o === "string"  ),
  "bigint"    : (...defs)=>name_validator("bigint"   ,(o)=>o !== undefined && o!==null && typeof o === "bigint"  ),
  "symbol"    : (...defs)=>name_validator("symbol"   ,(o)=>o !== undefined && o!==null && typeof o === "symbol"  ),
  "function"  : (...defs)=>name_validator("function" ,(o)=>o !== undefined && o!==null && typeof o === "function"),
  "or"        : (...defs)=>{
    if ( defs.length < 1 ) {
      throw new RangeError( 'no definition was specified in `or`' );
    }

    defs.forEach( (e,i)=>{
      const m = check_if_proper_vali( e );
      if ( m !== null ) {
        throw new RangeError(`the argument at or(${i}) is ${m}` );
      }
    });

    return (
      name_validator( "or", (o,c=null_context)=>{
        // This implements the logical operator `or`; check every element
        // before determine the result to obtain a user-friendly diagnosis
        // report.
        return (
          defs.map( (f,i)=>{
            c.enter(i,f);
            try {
              return c.notify( f(o,c) );
            } finally {
              c.leave();
            }
          }).some(e=>!!e)
        );
      })
    );
  },

  "and" : (...defs)=>{
    //1
    if ( defs.length < 1 ) {
      throw new RangeError( 'no definition was specified in `and`' );
    }
    //2
    defs.forEach( (e,i)=>{
      const m = check_if_proper_vali( e );
      if ( m !== null ) {
        throw new RangeError(`the argument at or(${i}) is ${m}` );
      }
    });

    //3
    return (
      name_validator( "and", (o,c=null_context)=>{
        // This implements the logical operator `and`; check every element
        // before determine the result to obtain a user-friendly diagnosis
        // report.
        return (
          defs.map( (f,i)=>{
            c.enter(i,f);
            try {
              return c.notify( f(o,c) );
            } finally {
              c.leave();
            }
          }).every(e=>!!e)
        );
      })
    );
  },

  "not" : (def)=>{
    if ( def === undefined || def === null ) {
      throw new RangeError( 'no definition was specified in `not`' );
    }
    return (
      name_validator( "not", (o,c=null_context)=>{
        return (
          ! (()=>{
            c.enter('op',def);
            try {
              return c.notify( def( o,c ) );
            } finally {
              c.leave();
            }
          })()
        );
      })
    );
  },

  "thru" : (def)=>{
    if ( def === undefined || def === null ) {
      throw new RangeError( 'no definition was specified in `not`' );
    }
    return (
      name_validator( "thru", (o,c=null_context)=>{
        return (
          (()=>{
            c.enter('op',def);
            try {
              return c.notify( def( o,c ) );
            } finally {
              c.leave();
            }
          })()
        );
      })
    );
  },

  "object" : (...defs)=>{
    if ( ! defs.every(e=>e!==null && e!==undefined && (typeof e ==='object'))) {
      throw new RangeError( 'every argument must be an object' );
    }

    return (
      name_validator( "object", (o,c=null_context)=>{
        if ( o === null || o === undefined ) {
          return false;
        }

        if ( typeof o !== 'object' ) {
          return false;
        }

        // >>> ADDED (Tue, 09 May 2023 16:31:43 +0900)
        o = unprevent(o);
        // <<< ADDED (Tue, 09 May 2023 16:31:43 +0900)

        // This implements `object` operator; check every element before
        // determine the result to obtain a user-friendly diagnosis report.

        // `r` is an two-dimentional array of boolean.
        const r =
          defs.map(
            def=>Object.entries(def).map(
              ([key,value])=>{
                c.enter(key,value);
                try {
                  return c.notify( value( o[key], c ) );
                } finally {
                  c.leave();
                }
              }));
        // check if every element is true.
        return  r.every(e1=>e1.every(e2=>!!e2));
      })
    );
  },

  "array_of"    : (...defs)=>{
    return (
      name_validator( "array_of", (o,c=null_context)=>{
        if ( o === null || o === undefined ) {
          return false;
        }
        if ( ! Array.isArray( o ) ) {
          return false;
        }
        // >>> ADDED (Tue, 09 May 2023 16:31:43 +0900)
        o = unprevent(o);
        // <<< ADDED (Tue, 09 May 2023 16:31:43 +0900)

        const r = defs.map(
          (def,di)=>{
            return o.map( (e,i)=>{
              c.enter( `${i}`, def);
              try {
                return c.notify( def(e,c) );
              } finally {
                c.leave();
              }
            })
          });
        // check if every element is true.
        return  r.every(e1=>e1.every(e2=>!!e2));
        // return defs.every( (def)=>o.every(e=>def(e)));
      })
    );
  },

  "array"    : (...defs)=>{
    return (
      name_validator( "array", (o,c=null_context)=>{
        if ( o === null || o === undefined ) {
          return false;
        }
        if ( ! Array.isArray( o ) ) {
          return false;
        }

        // >>> ADDED (Tue, 09 May 2023 16:31:43 +0900)
        o = unprevent(o);
        // <<< ADDED (Tue, 09 May 2023 16:31:43 +0900)

        const r = defs.map( (def,i)=>{
          c.enter( `${i}`, def);
          try {
            return c.notify( def( o[i], c ) );
          } finally {
            c.leave();
          }
        });

        const rr = (()=>{
          if ( o.length != defs.length ) {
            c.enter( `arr:${o.length}!==def:${defs.length}` , {[SCHEMA_VALIDATOR_NAME]: 'length-comparator'  } );
            try {
              return c.notify( false );
            } finally {
              c.leave();
            }
          } else {
            return true;
          }
        })();

        return rr && r.every(e1=>!!e1);

        // return defs.every( (def,i)=>def( o[i] ) );
      })
    );
  },

  "equals"    :(val)=>name_validator( "equals", (o)=>o === val ),

  "uuid"    : (...defs)=>{
    return (
      name_validator(
        "uuid",
        (o)=>(typeof o ==='string') && (/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).test( o )
      )
    );
  },

  [SCHEMA_VALIDATOR_COMPILE] : schema_validator_template_literal_compile,
  [SCHEMA_VALIDATOR_DEFINE] : schema_validator_template_literal_define,

  [SCHEMA_VALIDATOR_CURRENT_COMPILE] : schema_validator_template_literal_compile,
  [SCHEMA_VALIDATOR_CURRENT_DEFINE] : schema_validator_template_literal_define,

  "statement" : function statement(...args) {
    return this[SCHEMA_VALIDATOR_CURRENT_COMPILE].call(this,...args);
  },
  "compile" : function compile(...args) {
    return this[SCHEMA_VALIDATOR_CURRENT_COMPILE].call(this,...args);
  },
  "define" : function define(...args) {
    return this[SCHEMA_VALIDATOR_CURRENT_DEFINE].call(this,...args);
  },

  "clone" : cloneSchema,
};



/*
 * *****  WARNING FOR A SPECIAL HARD CODING *****
 *
 * 1. The module `prevent-undefined` already has a dependency ot the module
 *    `vanilla-schema-validator` as a reference to `trace_validator()`
 *    function.
 * 2. The module `prevent-undefined` is built via `sqlmacro` simple build
 *    system which only supports single-index.js-projects.
 * 3. That is, any circular dependencies are not allowed since index.js is not
 *    easily split up to submodules.
 * 4. The operators sucha as array()/array_of()/object() in
 *    `vanilla-schema-validator` should call `unprevent()` before they process
 *    their objects specified as arguments to have `undefined()` operator work
 *    properly.
 *
 * The following block of code is copied from the module
 * `prevent-undefined/index.js`; and it should be synchronized to the original
 * block of code.
 *
 * (Tue, 09 May 2023 16:31:43 +0900)
 *
 *
 * BEGIN HARD CODING >>>
 *
 */
const __UNPREVENT__                            = Symbol.for( '__UNPREVENT__' );
const __IS_PREVENTED_UNDEFINED__               = Symbol.for( '__IS_PREVENTED_UNDEFINED__' );
function isUndefinedPrevented(o){
  if ( o && Object.hasOwn( o, __IS_PREVENTED_UNDEFINED__ ) ) {
    return true;
  } else {
    return false;
  }
}

function unprevent(o) {
  if ( isUndefinedPrevented(o) ) {
    return unprevent( o[__UNPREVENT__] );
  } else {
    return o;
  }
}
/*
 * <<< END HARD CODING
 *
 * (Tue, 09 May 2023 16:31:43 +0900)
 *
 */


function createSchema() {
  return {};
}

const schema = (()=>{
  const schema = createSchema();
  Object.assign( schema, standardValis );
  return schema;
})();


