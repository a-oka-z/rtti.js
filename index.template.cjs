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


module.exports.RTTI    = RTTI;
module.exports.INFO    = INFO;
module.exports.mkrtti  = mkrtti;
module.exports.rtti    = rtti;

