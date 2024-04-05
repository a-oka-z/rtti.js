
import util from 'node:util';
import assert from 'node:assert/strict';
import { test, describe, it, before, after }  from 'node:test' ;
import { schema, trace_validator, typecast, SCHEMA_VALIDATOR_SOURCE, SCHEMA_VALIDATOR_NAME } from 'vanilla-schema-validator';
import { typesafe_function } from 'runtime-typesafety' ;



describe('STATEMENT COMPILER test basic 1.1 ( with annotations )', ()=>{
  it( 'as 1', {skip:true }, ()=>{
    const schema1 = schema.clone();

    schema1.BEGIN_MODULE('helo');

    schema1.compile`object()`()
    schema1.define`
      t_hello : object(),
      t_world : object(),
    `;
    schema1.define`t_foo : object()`;
    schema1.define`t_bar : object()`;

    schema1.END_MODULE();
  });

  it( 'as 2' ,()=>{
    const schema2 = schema.clone();
    schema2.BEGIN_MODULE('hello');
    const fn = typesafe_function(
      async function hello() {
      },
      {
        typesafe_input : schema2.compile`
          array(
            or(
              object(
                path    : array_of( string() ),
                lang_id : or( string(), null() ),
              ),
            )
          )`,
        typesafe_output : schema2.compile`
          array(
            or(
              object(
                path    : array_of( string() ),
                lang_id : or( string(), null() ),
              ),
            )
          )`
      }
    );
    schema2.END_MODULE('hello');
    console.log( fn );
  });
});


