params: body
'use strict'

function inspect(s) {
  return JSON.stringify( s, (k,v)=>typeof v === 'function' ? v.toString() : v, 2 );
}





<%=body %>


module.exports.INFO              = INFO;
module.exports.rtti              = schema;
module.exports.schema            = schema;
module.exports.make_vali_factory = make_vali_factory;

module.exports.makeValiFactory   = makeValiFactory;
module.exports.newRtti           = newRtti;

