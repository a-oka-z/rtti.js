
import util from 'node:util';
import assert from 'node:assert/strict';
import { test, describe, it, before, after }  from 'node:test' ;
import { schema, trace_validator, typecast, SCHEMA_VALIDATOR_SOURCE, SCHEMA_VALIDATOR_NAME } from 'vanilla-schema-validator';



describe('STATEMENT COMPILER test basic 1.1 ( with annotations )', ()=>{
  it( 'as 1', ()=>{

    schema.BEGIN_MODULE('helo');

    schema.compile`object()`()
    schema.define`
      t_hello : object(),
      t_world : object(),
    `;
    schema.define`t_foo : object()`;
    schema.define`t_bar : object()`;

    schema.END_MODULE();
  });
});


