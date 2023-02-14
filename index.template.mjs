params: body
'use strict';

function inspect(s) {
  return JSON.stringify( s, (k,v)=>typeof v === 'function' ? v.toString() : v, 2 );
}





<%=body%>

export {
  schema,
  make_vali_factory,
  vali_to_string,
  SchemaValidatorContext,
  SCHEMA_VALIDATOR_SOURCE,
  SCHEMA_VALIDATOR_NAME,
};

