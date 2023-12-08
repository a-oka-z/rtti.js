
// This file is currently not used.
// (Fri, 08 Dec 2023 19:43:14 +0900)

if ( typeof util !== 'undefined' ) {
  Object.assign( util.inspect.defaultOptions, {
    depth           : null,
    maxArrayLength  : null,
    maxStringLength : null,
    breakLength     : 1,
    compact         : false,
  });
}

