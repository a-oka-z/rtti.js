params: body
'use strict';

function inspect(s) {
  return JSON.stringify( s, (k,v)=>typeof v === 'function' ? v.toString() : v, 2 );
}





<%=body%>

export {
  schema,
  vali_to_string,
  trace_validator,
  SCHEMA_VALIDATOR_SOURCE,
  SCHEMA_VALIDATOR_NAME,
};

