params: body
'use strict';

/*
 * Took from MDN then, modified.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
 * Tue, 02 Jul 2024 17:54:58 +0900
 */
function getReplacer() {
  const ancestors = [];

  return function (key, value) {
    if (typeof value !== "object" || value === null) {
      if ( typeof value === 'function' ) {
        return value.toString();
      }
      return value;
    }

    // `this` is the object that value is contained in,
    // i.e., its direct parent.
    while (ancestors.length > 0 && ancestors.at(-1) !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(value)) {
      return "[Circular]";
    }
    ancestors.push(value);
    return value;
  };
}

function inspect(s) {
  return JSON.stringify( s, getReplacer(), 2 );
}





<%=body %>

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

