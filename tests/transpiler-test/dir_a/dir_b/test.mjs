
import { schema } from "vanilla-schema-validator";

/*
 * #VANILLA_SCHEMA_VALIDATOR enable TRANSPILE
 */

BEGIN_MODULE( import.meta );

schema.define`
  test : object(
    name :string(),
  ),
`;


END_MODULE();

