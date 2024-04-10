
const { schema } = require( "vanilla-schema-validator" );

/*
 * #VANILLA_SCHEMA_VALIDATOR ENABLE TRANSPILE
 */

schema.BEGIN_MODULE({ dirname: __dirname, filename:__filename });

schema.define`
  test : object(
    name :string(),
  )
`;


schema.END_MODULE();

