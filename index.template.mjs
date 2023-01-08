params: body
'use strict';

function inspect(s) {
  return JSON.stringify( s, (k,v)=>typeof v === 'function' ? v.toString() : v, 2 );
}





<%=body%>


export {
  INFO,
  schema,
  schema as rtti,
  make_vali_factory,
  vali_to_string,

  makeValiFactory,
  newRtti,
};

