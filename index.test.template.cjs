params: body
'use strict';

const { test, describe, it, before, after }  = require( 'node:test' );
const util   = require( 'node:util' );
const assert = require( 'node:assert/strict' );
const { schema, make_vali_factory, trace_validator, SchemaValidatorContext, SCHEMA_VALIDATOR_SOURCE, SCHEMA_VALIDATOR_NAME } = require( './index.cjs' );

<%=body %>
