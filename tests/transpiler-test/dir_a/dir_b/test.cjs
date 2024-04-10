
const { schema } = require( "vanilla-schema-validator" );

/*
 * #VANILLA_SCHEMA_VALIDATOR ENABLE TRANSPILE
 */

BEGIN_MODULE({ dirname: __dirname, filename:__filename });

schema.define`
  test : object(
    name :string(),
  ),
`;


END_MODULE();

