#!/bin/env node

console.error( 'VSV', process.argv );
console.error( 'VSV:env.HELLO', process.env.HELLO );

import yargs from "yargs";
import { hideBin } from 'yargs/helpers'
import { build, build_doc } from "vanilla-schema-validator/transpiler";

  yargs(hideBin(process.argv))
    .scriptName( "vsv" )
    .usage('$0 <cmd> [args]' )
    .showHelpOnFail( true )
    .command({
      command : 'build',
      desc : 'traverse all files under the specified directory and transpile them.',
      builder : (yargs) =>{
        yargs.option( 'input-dir', {
          type: 'string',
          default: '.',
          describe: 'the directory where the all transpiled files go'
        });
        yargs.option( 'output-dir', {
          type: 'string',
          default: './out',
          describe: 'the directory where the all transpiled files go'
        });
        yargs.option( 'extensions', {
          type: 'string',
          default: [ 'mjs', 'cjs','js' ],
          array : true,
          describe: 'the directory where the all transpiled files go'
        });
      },
      handler: (nargs)=>{
        console.log( 'starting `build` command...' );
        build(nargs);
      }
    })
    .command({
      command : 'build-doc',
      desc : 'read the specified JavaScript module and generate a documentation of all validators defined in it',
      builder : (yargs) =>{
        yargs.option( 'input', {
          type: 'string',
          demandOption:true,
          describe: 'the file to transpile'
        });
      },
      handler: (argv)=>{
        build_doc( argv );
      }
    })
    .help()
    .demandCommand()
    .argv
