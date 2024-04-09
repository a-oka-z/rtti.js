#!/bin/env node

console.error( 'VSV', process.argv );
console.error( 'VSV:env.HELLO', process.env.HELLO );

import yargs from "yargs";
import { hideBin } from 'yargs/helpers'
import { build, transpile } from "vanilla-schema-validator/transpiler";

  yargs(hideBin(process.argv))
    .scriptName( "transpiler" )
    .usage('$0 <cmd> [args]' )
    .showHelpOnFail( true )
    .command({
      command : 'build',
      desc : 'traverse all files under the specified directory and transpile them.',
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
        build(nargs);
      }
    })
    .command({
      command : 'transpile',
      desc : 'analyze progress status and update the (PROGRESS) tag',
      builder : (yargs) =>{
        yargs.option( 'input', {
          type: 'string',
          demandOption:true,
          describe: 'the file to transpile'
        });
      },
      handler: (argv)=>{
        transpile( argv );
      }
    })
    .help()
    .demandCommand()
    .argv
