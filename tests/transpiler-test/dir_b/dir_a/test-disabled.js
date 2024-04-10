
import { schema } from "vanilla-schema-validator";

/*
 * #VANILLA_SCHEMA_VALIDATOR disabled TRANSPILE
 */

schema.BEGIN_MODULE( import.meta );

schema.define`
  test : object(
    name :string(),
  ),
`;


schema.END_MODULE();

