params: body
'use strict';

function inspect(s) {
  return JSON.stringify( s, (k,v)=>typeof v === 'function' ? v.toString() : v, 2 );
}





<%=body %>


module.exports.fold_nargs        = fold_nargs;
module.exports.schema            = schema;
module.exports.vali_to_string    = vali_to_string;
module.exports.trace_validator   = trace_validator;
module.exports.typecast          = typecast;
module.exports.typeassert        = typeassert
module.exports.SCHEMA_VALIDATOR_RAW_SOURCE = SCHEMA_VALIDATOR_RAW_SOURCE;
module.exports.SCHEMA_VALIDATOR_SOURCE = SCHEMA_VALIDATOR_SOURCE;
module.exports.SCHEMA_VALIDATOR_SOURCE_FOR_DOC = SCHEMA_VALIDATOR_SOURCE_FOR_DOC;
module.exports.SCHEMA_VALIDATOR_NAME  = SCHEMA_VALIDATOR_NAME;
module.exports.SCHEMA_VALIDATOR_COMMENT = SCHEMA_VALIDATOR_COMMENT;
module.exports.SCHEMA_VALIDATOR_COMMENT_SOURCE  = SCHEMA_VALIDATOR_COMMENT_SOURCE;

