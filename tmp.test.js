

const joinStringsAndValues = ( strings, values )=>strings.map((s,i)=>(s + ((i in values ) ? values[i] : '' ) )  ).join('').trim();
const adjacent_token_is_colon = (tokens,idx)=>{
  for ( let i=idx;i<tokens.length; i++ ) {
    if ( tokens[i] === ':' ) {
      return i;
    } else if ( tokens[i].match (/\s+/ ) ){
      continue;
    } else {
      return -1;
    }
  }
  return -1;
};

function createTemplate() {

  return function rttijs_template_literal(strings, ... values) {
    const input  = joinStringsAndValues( strings, values );
    const i_tokens = Array.from( input.matchAll( /[(),:]|[a-zA-Z][a-zA-Z0-9]*|\s+/g ) ).map( e=>e[0] );
    const o_tokens = [ ...i_tokens ];
    const prefix = 'rtti.';

    const parenthesis_stack = [];

    let last_keyword = null;
    for ( let i=0; i<i_tokens.length; i++ ) {
      const curr_t = i_tokens[i];
      if ( false ) {
      } else if ( curr_t === '(' ) {
        if (false) {
        } else if ( last_keyword === 'object' ) {
          o_tokens[i] = '({';
          parenthesis_stack.push( '})' );
        } else  {
          parenthesis_stack.push( ')' );
        }

        last_keyword = null;
      } else if ( curr_t === ')' ) {
        o_tokens[i] = parenthesis_stack.pop();

        last_keyword = null;
      } else if ( curr_t === ',' ) {
        last_keyword = null;
      } else if ( curr_t === ':' ) {
        last_keyword = null;
      } else if ( curr_t.match( /\s+/ ) ) {
        // last_keyword = null;
      } else {
        if ( adjacent_token_is_colon( i_tokens, i+1 )<0 ) {
          o_tokens[i] = prefix + o_tokens[i] ;
        }
        last_keyword = i_tokens[i];
      }
    }

    const script = o_tokens.join('');
    const compiled_script = new Function( 'rtti', script);;

    const result = (...args)=>{
      return compiled_script(rttijs_template_literal,...args);
    };

    result.script = script;
    return result;
  }
}


