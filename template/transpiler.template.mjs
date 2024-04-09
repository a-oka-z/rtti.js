params: body
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





<%=body%>
