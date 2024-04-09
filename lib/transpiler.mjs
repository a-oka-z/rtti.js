'use strict';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import fs from "fs/promises";
import path from "path";
import { schema, trace_validator, typecast, SCHEMA_VALIDATOR_SOURCE, SCHEMA_VALIDATOR_NAME } from 'vanilla-schema-validator';
import { rip_comments, rip_directives } from  'comment-ripper' ;

function inspect(s) {
  return JSON.stringify( s, (k,v)=>typeof v === 'function' ? v.toString() : v, 2 );
}







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


async function transpile(nargs) {
  console.log(nargs);
  const {
    inputDir,
    outputDir,
    extensions,
  }= nargs;

  for await ( const i of getFiles( inputDir ) ) {
    if ( extensions.some( e=>i.endsWith( e ) ) ) {
      console.log( i );

    } else {
      console.log( i, 'ignored' );
    }
  };

}


if ( import.meta.url.endsWith( process.argv[1] ) ) {
  yargs(hideBin(process.argv))
    .scriptName( "transpiler" )
    .usage('$0 <cmd> [args]' )
    .showHelpOnFail( true )
    .command({
      command : 'run',
      desc : 'analyze progress status and update the (PROGRESS) tag',
      builder : (yargs) =>{
        yargs.positional( 'input-dir', {
          type: 'string',
          default: '.',
          describe: 'the directory where the all transpiled files go'
        });
        yargs.positional( 'output-dir', {
          type: 'string',
          default: './out',
          describe: 'the directory where the all transpiled files go'
        });
        yargs.positional( 'extensions', {
          type: 'string',
          default: [ 'mjs', 'cjs','js' ],
          array : true,
          describe: 'the directory where the all transpiled files go'
        });
      },
      handler: (nargs)=>{
        transpile(nargs);
      }
    })
    .command({
      command : 'report4excel',
      desc : 'analyze progress status and update the (PROGRESS) tag',
      builder : (yargs) =>{
        // yargs.positional( 'name', {
        //   type: 'string',
        //   default: 'Cambi',
        //   describe: 'the name to say hello to'
        // })
      },
      handler: (argv)=>{
        outputReportForExcel();
      }
    })
    .help()
    .demandCommand()
    .argv
}


