'use strict';

const yargs = require( 'yargs' );
const { hideBin } = require( 'yargs/helpers' );
const fs = require('fs/promises');
const path = require('path');
const  { schema, trace_validator, typecast, SCHEMA_VALIDATOR_SOURCE, SCHEMA_VALIDATOR_NAME } = require( 'vanilla-schema-validator' );
const { rip_comments, rip_directives } = require( 'rip_comments' );
const child_process = require( 'node:child_process' );

function inspect(s) {
  return JSON.stringify( s, (k,v)=>typeof v === 'function' ? v.toString() : v, 2 );
}






const DEBUG = false;
const VANILLA_SCHEMA_VALIDATOR_MODULES           = Symbol.for( 'vanilla-schema-validator.modules' );
const VANILLA_SCHEMA_VALIDATOR_DIRECTIVE_0 = [ 'VANILLA_SCHEMA_VALIDATOR', 'ENABLE', 'TRANSPILE' ];
const VANILLA_SCHEMA_VALIDATOR_DIRECTIVE_1 = [ 'VANILLA_SCHEMA_VALIDATOR', 'ENABLE', 'DOCUMENTATION' ];

const compare_arrays = (a1, a2) =>
  a1.length == a2.length &&
  a1.every( (element, index) => element === a2[index] );



async function* getFiles( dir ) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for ( const dirent of dirents ) {
    const filename = path.join( dir, dirent.name );
    if ( dirent.isDirectory() ) {
      yield* getFiles( filename );
    } else {
      yield filename;
    }
  }
}


async function proc_build(nargs) {
  if ( DEBUG ) {
    console.log(nargs);
  }
  const {
    inputDir,
    outputDir,
    extensions,
    fn_module_to_string,
    fn_check_directive,
  }= nargs;

  const async_results = [];
  const request_paths = [];

  console.log( 'building ... ', inputDir );
  for await ( const rel_path of getFiles( inputDir ) ) {
    if ( extensions.some( e=>rel_path.endsWith( e ) ) ) {
      console.log( 'examiniing:', rel_path );
      const f = (await fs.readFile( rel_path )).toString();
      const r = rip_directives( rip_comments( f ) ).map( s=>s.split( /\s+/ ).map(e=>e.trim() ) );

      // HERE
      if ( r.some( directive_arr=>fn_check_directive( directive_arr ) ) ) {
        const abs_path = path.resolve( process.cwd(), rel_path );
        console.log( 'importing ', abs_path );
        request_paths.push( abs_path );
        async_results.push( import( abs_path  ) );
      } else {
        // console.log( rel_path, 'ignored2', r );
      }
    } else {
      // console.log( rel_path, 'ignored' );
    }
  };

  await Promise.all( async_results );

  const modules = schema[VANILLA_SCHEMA_VALIDATOR_MODULES];


  if ( DEBUG ) {
    console.error( 'modules', modules );
    console.error( 'all', modules
      .map(e=>e.filename) );
    console.error( 'filtered', modules
      .filter(e=>request_paths.some( ee=>ee===e.filename ))
      .map(e=>e.filename)
    );
    console.error( 'request_paths',
      request_paths );
  }

  const compiled_modules = modules
    .filter( module=>request_paths.some( ee=>ee===module.filename ))
    .map(module=>({
      ...module,
      output_filename : path.join( outputDir, path.relative( inputDir, module.output_filename ?? module.filename ) ),
      output_string   : fn_module_to_string( module ), // module.transpile() // HERE
    }));

  if ( DEBUG ) {
    console.error( 'compiled', compiled_modules   );
  }

  for ( const module of compiled_modules ) {
    const output_file = module.output_filename;
    const output_string = module.output_string;
    fs.mkdir( path.dirname( output_file ), {recursive:true} );
    fs.writeFile( output_file, output_string );
    console.log( 'writing to', output_file );
  }
}


/*
 * fn_module_to_string()
 *
 * For further information about `fn_module_to_string()`,
 * see the function `index.js/BEGIN_MODULE()`
 *
 */
async function build(nargs) {
  return proc_build({
    ...nargs,
    fn_module_to_string : (module)=>module.transpile(),
    fn_check_directive  : (directive_arr)=>compare_arrays( directive_arr,  VANILLA_SCHEMA_VALIDATOR_DIRECTIVE_0 )
  });
}


async function build_doc(nargs) {
  return proc_build({
    ...nargs,
    fn_module_to_string : (module)=>module.generate_documentation(),
    fn_check_directive  : (directive_arr)=>compare_arrays( directive_arr,  VANILLA_SCHEMA_VALIDATOR_DIRECTIVE_1 )
  });
}




module.exports.build = build;
module.exports.build_doc = build_doc;