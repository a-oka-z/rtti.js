 rtti.js
=====================

**rtti.js** is a convention to implement object validation in JavaScript. The
idea behind this convention is simple:

```javascript
import  { rtti } from './index.mjs';

const val1 =  42;
const val2 = '42';

console.error( rtti.string()( val1 )); // false
console.error( rtti.string()( val2 )); // true
console.error( rtti.number()( val1 )); // true
console.error( rtti.number()( val2 )); // false
```

This might not impress you; but how about below:

```javascript
import  { rtti } from './index.mjs';

const t_person = rtti.object({
  name    : rtti.string(),
  age     : rtti.number(),
  visited : rtti.boolean(),
});

const val3 = {
  name    :'John',
  age     : 42,
  visited : true,
};

console.error( t_person( val3 ) ); // true
```

Every function that is defined in **rtti** is merely a factory to create an
evaluator; you can create evaluators manually. For example, the following
example also works properly:

```javascript
import  { rtti } from './index.mjs';

const t_person = rtti.object({
  name    : rtti.string(),
  age     : rtti.number(),
  visited : rtti.boolean(),
  since   : (o)=>o instanceof Date,
});

const val4 = {
  name    :'John',
  age     : 42,
  visited : true,
  since   : new Date('24 Jan 1986 17:58:24 -0700'),
};

const val5 = {
  name    :'John',
  age     : 42,
  visited : true,
  since   : { is_wrong_date  : true }
};

console.error( t_person( val4 ) ); // true
console.error( t_person( val5 ) ); // false
```

However, I recommend you not to use `instanceof` for runtime type checking
because type information of JavaScript is inherently not reliable.

[Determining with absolute accuracy whether or not a JavaScript object is an array][isarray]

[isarray]: https://web.mit.edu/jwalden/www/isArray.html

IMHO, the only way to check type at runtime in JavaScript is object validation;
that is, to check every property are set as expected.


As you may seen above, **rtti.js** is not a framework; this is merely a
convention which implements runtime type checking in the practical world. Since
**rtti.js** is not a framework, you can use `rtti.js` even without the npm
package. **rtti.js** is merely an utility function set to implement
**rtti.js**.


 The Convention of Evaluators
--------------------------------------------------------------------------------
The convention define some rules; rules that every evaluator should follow is
following :

1. When the number of argument is one, examine the given value. Return `true` if
  the value is valid as the type you want; return `false` otherwise.
2. When the number of argument is less than or equals to zero, return the name
  of the type; if you are not interested in displaying contents of types, you
  can ignore this behavior.
3. When the number of argument is greater than or equals to two, return the symbol
  which you can get by the `Symbol.for('RTTI')`.

The rule 3 is a failproof; you often forget to call an evaluator generator and
if you do, the function always returns truthy value which may confuse you. If
you are not afraid of such mistakes, you can ignore it.

The evaluators which are defined in `rtti`  conform to rule 1, rule 2 and rule 3.
`rtti.object()`  checks if the passed functions conform to rule 3 and if
not, throw `TypeError()`.



 `mkrtti()`
--------------------------------------------------------------------------------
`mkrtti` is a helper function to that make those functions to conform the three
rules above. Its implementation is following:

```javascript
  (chkArgs, infoGen, funcGen)=>(
    (...defs)=>{
      check_if_all_rtti_conformed(...defs);
      chkArgs(...defs);
      const func = funcGen(...defs);
      const info = infoGen(...defs);
      return (...args)=>args.length<1 ? info : 1<args.length ? RTTI : func(args[0]);
    }
  );
```

#### The Definition of the Parameters ####

- `chkArgs` is a function which offers a chance to check the arguments.
- `infoGen` is a function to create a string value to express the type name.
- `funcGen` is a function to create the evaluator.


#### Example ####

The following example implements a null checker.

```javascript
  const null_checker = mkrtti(
    // null checker takes no argument
    (...defs)=>{
      if ( defs.length !== 0 ) {
        throw new RangeError( 'no definition can be specified' );
      }
    }, 

    // a closure that returns the name of the type
    (...defs)=>"null",

    // a closure that does the evaluation
    (...defs)=>(o)=>o === null 
  );
```




 Conclusion
--------------------------------------------------------------------------------
That's all. Thank you very much.


[]: # vim: sw=2 sts=2 ts=2 
