params: body


import util from 'node:util';
import assert from 'node:assert/strict';
import { test, describe, it, before, after }  from 'node:test' ;
import { schema, trace_validator, typecast, SCHEMA_VALIDATOR_SOURCE, SCHEMA_VALIDATOR_NAME } from './index.mjs' ;

<%=body %>
