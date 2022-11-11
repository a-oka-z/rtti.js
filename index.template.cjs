params: body
'use strict'

const util = require('util');
function inspect(s) {
  return JSON.stringify( s, null, 2 );
  // return util.inspect( s, {
  //   depth:null,
  //   // colors:true,
  // });
}

<%=body %>


module.exports.INFO            = INFO;
module.exports.mk_vali_factory = mk_vali_factory;
module.exports.rtti            = rtti;

