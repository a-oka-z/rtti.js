params: body
'use strict';

const  util   = require( 'node:util' );
const  assert = require( 'node:assert/strict' );
const  { test, describe, it, before, after }  = require( 'node:test' );
const  { schema, trace_validator, typecast, SCHEMA_VALIDATOR_SOURCE, SCHEMA_VALIDATOR_NAME } = require( './index.cjs' );

<%=body %>
