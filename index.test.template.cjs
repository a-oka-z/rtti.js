params: body
'use strict';

const { test, describe, it, before, after }  = require( 'node:test' );
const util   = require( 'node:util' );
const assert = require( 'node:assert/strict' );
const { INFO, schema, rtti, make_vali_factory } = require( './index.cjs' );

<%=body %>
