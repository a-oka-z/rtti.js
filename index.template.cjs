params: body
'use strict'

function inspect(s) {
  return JSON.stringify( s, (k,v)=>typeof v === 'function' ? v.toString() : v, 2 );
}





<%=body %>


module.exports.schema            = schema;
module.exports.make_vali_factory = make_vali_factory;
module.exports.vali_to_string    = vali_to_string;
module.exports.SchemaValidatorContext = SchemaValidatorContext;
module.exports.SCHEMA_VALIDATOR_SOURCE = SCHEMA_VALIDATOR_SOURCE;
module.exports.SCHEMA_VALIDATOR_NAME  = SCHEMA_VALIDATOR_NAME;


