params: body
'use strict';

const yargs = require( 'yargs' );
const { hideBin } = require( 'yargs/helpers' );
const fs = require('fs/promises');
const path = require('path');
const  { schema, trace_validator, typecast, SCHEMA_VALIDATOR_SOURCE, SCHEMA_VALIDATOR_NAME } = require( 'vanilla-schema-validator' );
const { rip_comments, rip_directives } = require( 'rip_comments' );

function inspect(s) {
  return JSON.stringify( s, (k,v)=>typeof v === 'function' ? v.toString() : v, 2 );
}





<%=body %>



