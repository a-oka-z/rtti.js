const module_name = "vanilla-schema-validator";
const INFO = Symbol.for( 'dump schema information' );

const SCHEMA_VALIDATOR_STANDARD_STATEMENT_COMPILE  = "vanilla-schema-validator.standard-compiler";
const SCHEMA_VALIDATOR_STANDARD_STATEMENT_EXEXUTE  = "vanilla-schema-validator.standard-executor";
const SCHEMA_VALIDATOR_CURRENTT_COMPILER  = "vanilla-schema-validator.compiler";
const SCHEMA_VALIDATOR_CURRENTT_EXECUTOR  = "vanilla-schema-validator.executor";

const SCHEMA_VALIDATOR_SOURCE = Symbol.for( 'vanilla-schema-validator.source' );
const SCHEMA_VALIDATOR_NAME   = Symbol.for( 'vanilla-schema-validator.name' );

class SchemaValidatorContext {
  result_stack;
  path_stack;
  constructor(...args) {
    this.path_stack = [];
    this.result_stack = [];
  }
  enter( field_name ) {
    this.path_stack.push( field_name );
  }
  notify( value ) {
    if ( typeof value !== 'boolean' ) {
      throw new TypeError( `notified an invalid value : ${value}` );
    }
    this.result_stack.push({
      path : [...this.path_stack],
      value : value,
    });
    return value;
  }
  leave() {
    return this.path_stack.pop();
  }
  result() {
    return [ ...this.result_stack ];
  }
  toString() {
    return this.result().map(e=>e.path.join('') + ':' + e.value ).join('\n');
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

const create_info_gen_from_string = ( info_gen_string )=>{
  if ( typeof info_gen_string === 'string' ) {
    return ()=>info_gen_string;
  } else {
    throw new TypeError('found an invalid argument');
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

function make_vali_factory(nargs) {
  let {
    name,
    source = name,
    factory,
  } = nargs;

  if ( name === undefined ) {
    throw new RangeError('`name` was not specified');
  }
  if ( typeof name !== 'string' ) {
    throw new RangeError('name is not a string value');
  }
  if ( typeof source !== 'string' ) {
    throw new RangeError( 'source is not a string value');
  }
  if ( factory === undefined ) {
    throw new ReferenceError( 'factory is not specified' );
  }
  if ( typeof factory !== 'function' ) {
    throw new ReferenceError( 'factory is not a function' );
  }

  const __validator_factory = function validator_factory( ...defs ) {
    const validator = factory.apply( this, defs );

    Object.defineProperties( validator, {
      name : {
        value : __validator_factory.name,
        enumerable : false,
        writable : false,
        configurable : true,
      },
      [SCHEMA_VALIDATOR_NAME]: {
        value : __validator_factory[SCHEMA_VALIDATOR_NAME],
        enumerable : true,
        writable : false,
        configurable : true,
      },
      [SCHEMA_VALIDATOR_SOURCE]: {
        value : __validator_factory[SCHEMA_VALIDATOR_SOURCE],
        enumerable : true,
        writable : false,
        configurable : true,
      },
    });

    return validator;
  };

  Object.defineProperties( __validator_factory, {
    name : {
      value : name,
      enumerable : false,
      writable : false,
      configurable : true,
    },
    [SCHEMA_VALIDATOR_NAME]: {
      value : name,
      enumerable : true,
      writable : false,
      configurable : true,
    },
    [SCHEMA_VALIDATOR_SOURCE]: {
      value : source,
      enumerable : true,
      writable : false,
      configurable : true,
    },
  });

  return __validator_factory;
};

const makeValiFactory = make_vali_factory;

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
   * For further information, see Atsushi Oka's daily log on Nov 17 2022.
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
        `[${module_name}] a compiled validator factory threw an error. '${e.message}'\ninformation:\nscript:${script}\n---\nschema:${JSON.stringify( schema, (k,v)=>typeof v==='function' ? '[function '+k+']' : v, 2)}\n---\n`;
      throw e;
      // throw new SyntaxError( 'an error was occured in a compiled `rtti.js` statement\n' + script,  {cause:e} );
    }
  };

  Object.defineProperties( result, {
    'script': {
      value : script,
      enumerable : true,
      writable : false,
      configurable : true,
    },
    [SCHEMA_VALIDATOR_SOURCE]: {
      value : script,
      enumerable : true,
      writable : false,
      configurable : true,
    },
  });

  return result;
};


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

  function output_elem( elem, indent_level ) {
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
      output( indent + `${elem.val_id ? elem.val_id +':' : '' }${schema_name}${elem.fac_id}(${paren_b}` );
    }
    for ( const sub_elem of elem.children ) {
      output_elem( sub_elem, indent_level + 1 ); 
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
    output( `      return (` );

    output_elem( elem, 0 ) ;
    remove_last_comma();

    output( `      );` );
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

  const input = joinStringsAndValues( strings, values );
  const compiled = schema_validator_script_compiler( input );
  const result   = compiled.factory_factory.call( this );

  // console.log( 'compiled_buf', compiled.compiled_buf.join('\n') );
  // console.log( 'decompiled',   result.t_default.toString() );

  return result.t_default;
}

function schema_validator_template_literal_execute( strings, ... values ) {
  if ( this === undefined )
    throw Error('this is undefined');
  if ( ! Array.isArray( strings ) ) {
    throw new TypeError( 'the first argument is not an array' );
  }
  if ( ! strings.every(e=>typeof e === 'string' ) )  {
    throw new TypeError( 'the array of the first argument contains a non-string value' );
  }

  const input = joinStringsAndValues( strings, values );
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
  "any"       : make_vali_factory({
    name : 'any',
    factory : (...defs)=>(o)=>true,
  }),
  "undefined" : make_vali_factory({
    name : "undefined",
    factory : (...defs)=>(o)=>typeof o === "undefined",
  }),
  "null"      : make_vali_factory({
    name : "null",
    factory :  (...defs)=>(o)=>o === null,
  }),
  "boolean"   : make_vali_factory({
    name : "boolean",
    factory : (...defs)=>(o)=>o !== undefined && o!==null && typeof o === "boolean" ,
  }),
  "number"    : make_vali_factory({
    name : "number",
    factory : (...defs)=>(o)=>o !== undefined && o!==null && typeof o === "number"   ,
  }),
  "string"    : make_vali_factory({
    name : "string",
    factory : (...defs)=>(o)=>o !== undefined && o!==null && typeof o === "string"   ,
  }),
  "bigint"    : make_vali_factory({
    name : "bigint",
    factory : (...defs)=>(o)=>o !== undefined && o!==null && typeof o === "bigint"   ,
  }),
  "symbol"    : make_vali_factory({
    name : "symbol",
    factory : (...defs)=>(o)=>o !== undefined && o!==null && typeof o === "symbol"   ,
  }),
  "function"  : make_vali_factory({
    name : "function",
    factory : (...defs)=>(o)=>o !== undefined && o!==null && typeof o === "function" ,
  }),
  "or"        : make_vali_factory({
    name : "or",
    factory : (...defs)=>{
      if ( defs.length < 1 ) {
        throw new RangeError( 'no definition was specified in `or`' );
      }
      defs.forEach( (e,i)=>{
        const m = check_if_proper_vali( e );
        if ( m !== null ) {
          throw new RangeError(`the argument at or(${i}) is ${m}` );
        }
      });
      return (o,c=null_context)=>{
        // This implements the logical operator `or`; check every element
        // before determine the result to obtain a user-friendly diagnosis
        // report.
        return (
          defs.map( (f,i)=>{
            c.enter(`|${i}`);
            try {
              return c.notify( f(o,c) );
            } finally {
              c.leave();
            }
          }).some(e=>!!e)
        );
      };
    },
  }),
  "and"       : make_vali_factory({
    name : "and",
    factory : (...defs)=>{
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
      return (o,c=null_context)=>{
        // This implements the logical operator `and`; check every element
        // before determine the result to obtain a user-friendly diagnosis
        // report.
        return c.notify(
          defs.map( (f,i)=>{
            c.enter(`&${i}`);
            try {
              return c.notify( f(o,c) );
            } finally {
              c.leave();
            }
          }).every(e=>!!e)
        );
      };
    },
  }),
  "not"       : make_vali_factory({
    name : "not",
    factory : (...defs)=>{
      if ( defs.length < 1 ) {
        throw new RangeError( 'no definition was specified in `not`' );
      }
      return (o,c=null_context)=>{
        return c.notify(
          ! (()=>{
            c.enter('!');
            try {
              return c.notify( defs[0]( o,c ) );
            } finally {
              c.leave();
            }
          })()
        );
      };
    },
  }),
  "object"    : make_vali_factory({
    name : "object",
    factory : (...defs)=>{
      if ( ! defs.every(e=>e!==null && e!==undefined && (typeof e ==='object'))) {
        throw new RangeError( 'every argument must be an object' );
      }

      return (o,c=null_context)=>{
        if ( o === null || o === undefined ) {
          return false;
        }

        if ( typeof o !== 'object' ) {
          return false;
        }

        // This implements `object` operator; check every element before
        // determine the result to obtain a user-friendly diagnosis report.

        // `r` is an two-dimentional array of boolean.
        const r =
          defs.map(
            def=>Object.entries(def).map(
              ([key,value])=>{
                c.enter(`.${key}`);
                try {
                  return c.notify( value( o[key], c ) );
                } finally {
                  c.leave();
                }
              }));
        // check if every element is true.
        const r2 =  r.every(e1=>e1.every(e2=>!!e2));
        return c.notify(r2);
      };
    },
  }),
  "array_of"    : make_vali_factory({
    name : "array_of",
    factory : 
      (...defs)=>{
        return (o)=>{
          if ( o === null || o === undefined ) {
            return false;
          }
          if ( ! Array.isArray( o ) ) {
            return false;
          }
          return defs.every(
            (def)=>o.every(e=>def(e)));
        };
      },
  }),
  "array"    : make_vali_factory({
    name : "array",
    factory : (...defs)=>{
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
  }),
  "equals"    : make_vali_factory({
    name : "equals",
    factory : (val)=>(o)=>o === val,
  }),
  "uuid"    : make_vali_factory({
    name : "uuid",
    factory: (...defs)=>(o)=>(typeof o ==='string') && (/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).test( o ),
  }),

  [SCHEMA_VALIDATOR_STANDARD_STATEMENT_COMPILE] : schema_validator_template_literal_compile,
  [SCHEMA_VALIDATOR_STANDARD_STATEMENT_EXEXUTE] : schema_validator_template_literal_execute,

  [SCHEMA_VALIDATOR_CURRENTT_COMPILER] : schema_validator_template_literal_compile,
  [SCHEMA_VALIDATOR_CURRENTT_EXECUTOR] : schema_validator_template_literal_execute,

  "statement" : function statement(...args) {
    return this[SCHEMA_VALIDATOR_CURRENTT_COMPILER].call(this,...args);
  },
  "compile" : function compile(...args) {
    return this[SCHEMA_VALIDATOR_CURRENTT_COMPILER].call(this,...args);
  },
  "execute" : function execute(...args) {
    return this[SCHEMA_VALIDATOR_CURRENTT_EXECUTOR].call(this,...args);
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
