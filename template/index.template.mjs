params: body
'use strict';

function inspect(s) {
  return JSON.stringify( s, (k,v)=>typeof v === 'function' ? v.toString() : v, 2 );
}





<%=body%>

export {
  fold_nargs,
  schema,
  vali_to_string,
  trace_validator,
  typecast,
  typeassert,
  SCHEMA_VALIDATOR_RAW_SOURCE,
  SCHEMA_VALIDATOR_SOURCE,
  SCHEMA_VALIDATOR_SOURCE_FOR_DOC,
  SCHEMA_VALIDATOR_NAME,
  SCHEMA_VALIDATOR_COMMENT,
  SCHEMA_VALIDATOR_COMMENT_SOURCE,
};

