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

const compare_arrays = (a1, a2) =>
  a1.length == a2.length &&
  a1.every( (element, index) => element === a2[index] );

const VANILLA_SCHEMA_VALIDATOR_DIRECTIVE_0 = [ 'VANILLA_SCHEMA_VALIDATOR', 'ENABLE', 'TRANSPILE' ];


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


async function build(nargs) {
  console.log(nargs);
  const {
    inputDir,
    outputDir,
    extensions,
  }= nargs;

  const async_results = [];
  const request_paths = [];

  for await ( const rel_path of getFiles( inputDir ) ) {
    if ( extensions.some( e=>rel_path.endsWith( e ) ) ) {
      const f = (await fs.readFile( rel_path )).toString();
      const r = rip_directives( rip_comments( f ) ).map( s=>s.split( /\s+/ ).map(e=>e.trim() ) );

      if ( r.some( arr=> compare_arrays( arr,  VANILLA_SCHEMA_VALIDATOR_DIRECTIVE_0 ) ) ) {
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
    console.error( 'all', modules
      .map(e=>e.filename) );
    console.error( 'filtered', modules
      .filter(e=>request_paths.some(ee=>ee===e.filename))
      .map(e=>e.filename)
    );
    console.error( 'request_paths',
      request_paths );
  }

  const compiled_modules = modules
    .filter(e=>request_paths.some(ee=>ee===e.filename))
    .map(e=>({
      ...e,
      output_filename : path.join( outputDir, path.relative( inputDir, e.filename ) ),
      source:e.transpile()
    }));

  if ( DEBUG ) {
    console.error( 'compiled', compiled_modules   );
  }

  for ( const module of compiled_modules ) {
    const output_file = module.output_filename;
    const source = module.source;
    fs.mkdir( path.dirname( output_file ), {recursive:true} );
    fs.writeFile( output_file, source );
    console.log( 'writing to', output_file );
  }




}

async function transpile(nargs) {
  console.log(nargs);

}


// if ( import.meta.url.endsWith( process.argv[1] ) ) {
//   yargs(hideBin(process.argv))
//     .scriptName( "transpiler" )
//     .usage('$0 <cmd> [args]' )
//     .showHelpOnFail( true )
//     .command({
//       command : 'build',
//       desc : 'traverse all files under the specified directory and transpile them.',
//       builder : (yargs) =>{
//         yargs.positional( 'input-dir', {
//           type: 'string',
//           default: '.',
//           describe: 'the directory where the all transpiled files go'
//         });
//         yargs.positional( 'output-dir', {
//           type: 'string',
//           default: './out',
//           describe: 'the directory where the all transpiled files go'
//         });
//         yargs.positional( 'extensions', {
//           type: 'string',
//           default: [ 'mjs', 'cjs','js' ],
//           array : true,
//           describe: 'the directory where the all transpiled files go'
//         });
//       },
//       handler: (nargs)=>{
//         build(nargs);
//       }
//     })
//     .command({
//       command : 'transpile',
//       desc : 'analyze progress status and update the (PROGRESS) tag',
//       builder : (yargs) =>{
//         yargs.option( 'input', {
//           type: 'string',
//           demandOption:true,
//           describe: 'the file to transpile'
//         });
//       },
//       handler: (argv)=>{
//         transpile( argv );
//       }
//     })
//     .help()
//     .demandCommand()
//     .argv
// }
//
//


module.exports.build = build;
module.exports.transpile = transpile;