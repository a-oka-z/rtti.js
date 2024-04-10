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


  for await ( const rel_path of getFiles( inputDir ) ) {
    if ( extensions.some( e=>rel_path.endsWith( e ) ) ) {
      const f = (await fs.readFile( rel_path )).toString();
      const r = rip_directives( rip_comments( f ) ).map( s=>s.split( /\s+/ ).map(e=>e.trim() ) );
      if ( r.some( arr=> compare_arrays( arr,  VANILLA_SCHEMA_VALIDATOR_DIRECTIVE_0 ) ) ) {

        console.log( 'running vsv ', process.argv[0] );
        const vsv = child_process.spawn( 'vsv' , [ 'run', 'transpile', rel_path ], {
          cwd : process.cwd(),
          env : {
            ...process.env,
            HELLO :'YES,HELLO',
          },
        });

        vsv.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        vsv.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
        });

        vsv.on('close', (code) => {
        });

      } else {
        // console.log( rel_path, 'ignored2', r );
      }
    } else {
      // console.log( rel_path, 'ignored' );
    }
  };

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