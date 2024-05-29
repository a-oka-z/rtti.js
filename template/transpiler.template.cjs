params: body
'use strict';

const yargs = require( 'yargs' );
const { hideBin } = require( 'yargs/helpers' );
const fs = require('fs/promises');
const path = require('path');
const  { schema, trace_validator, typecast, SCHEMA_VALIDATOR_SOURCE, SCHEMA_VALIDATOR_NAME, SCHEMA_VALIDATOR_COMMENT, SCHEMA_VALIDATOR_COMMENT_SOURCE } = require( 'vanilla-schema-validator' );
const { rip_comments, rip_directives } = require( 'rip_comments' );
const child_process = require( 'node:child_process' );

function inspect(s) {
  return JSON.stringify( s, (k,v)=>typeof v === 'function' ? v.toString() : v, 2 );
}





<%=body %>

module.exports.build = build;
module.exports.build_doc  = build_doc;
module.exports.build_html = build_html;
module.exports.build_md   = build_md;
