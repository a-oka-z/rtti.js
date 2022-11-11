 rtti.js
=====================

**rtti.js** is a non-opinionated simple convention to accomplish object
validation in JavaScript. The idea behind **rtti.js** is simple:

```javascript
import  { rtti } from './index.mjs';

console.error( rtti.string()(  42  )); // false
console.error( rtti.string()( '42' )); // true
console.error( rtti.number()(  42  )); // true
console.error( rtti.number()( '42' )); // false
```

Compounding these functions enables you to validate more complex objects :

```javascript
import  { rtti } from './index.mjs';

const t_person = rtti.object({
  name    : rtti.string(),
  age     : rtti.number(),
  visited : rtti.boolean(),
});

const obj1 = {
  name    :'John',
  age     : 42,
  visited : true,
};
console.error( t_person( obj1 ) ); // true
```

The functions that are defined in **rtti** are merely factories of various
validators. They are only utilities and not requirement; you can create
validators on the fly. For example, the following example works, too:

```javascript
import  { rtti } from './index.mjs';

const t_person = rtti.object({
  name    : rtti.string(),
  age     : rtti.number(),
  visited : rtti.boolean(),
  since   : (o)=>o instanceof Date,
});

const obj1 = {
  name    :'John',
  age     : 42,
  visited : true,
  since   : new Date('24 Jan 1986 17:58:24 -0700'),
};
console.error( t_person( obj1 ) ); // true

const obj2 = {
  name    :'John',
  age     : 42,
  visited : true,
  since   : { is_wrong_date  : true }
};

console.error( t_person( obj2 ) ); // false
```

Basic concept of this convention is quit simple and with this convention, you
can accomplish validation in most cases without these complicated frameworks.


 Create Validators via a Template Literal
--------------------------------------------------------------------------------
The `rtti` object is also a function which can be used as a template literal:

```javascript
const type = rtti`
  object(
    foo : number(),
    bar : string(),
  )
`();

const v = {
  foo:42,
  bar:'hello',
};
console.error( type( v ) ); // true;

const v2 = {
  foo: false,
  bar: BigInt(1),
};
console.error( type( v2 ) ); // false;
```

You can add types by setting your validator as a property on the `rtti`
function:

```javascript
const type = rtti`
  object(
    foo : Foo(),
    bar : Bar(),
  )
`();

rtti.Foo = (o)=>typeof o ==='number';
rtti.Bar = (o)=>typeof o ==='string';


const v = {
  foo:42,
  bar:'hello',
};
console.error( type( v ) ); // true;
```

 Create Your Own `rtti` Object
--------------------------------------------------------------------------------
You usually find yourself to avoid setting on the global `rtti` function; you
can create your own to avoid conflict.

```javascript
import  { rtti, newRtti } from './index.mjs';

const rtti2 = newRtti();
rtti2.Foo = (o)=>typeof o ==='number';
rtti2.Bar = (o)=>typeof o ==='string';

const type2 = rtti2`
  object(
    foo : Foo(),
    bar : Bar(),
  )
`();

const v = {
  foo:42,
  bar:'hello',
};
console.error( type2( v ) ); // true;


const type1 = rtti`
  object(
    foo : Foo(),
    bar : Bar(),
  )
`();
console.error( type1( v ) ); // error;
```


 About Avoiding `instanceof` 
--------------------------------------------------------------------------------
IMHO, you should avoid to perform type checking by using
`instanceof` because type information of JavaScript is inherently not reliable.

[Determining with absolute accuracy whether or not a JavaScript object is an array][isarray]

[isarray]: https://web.mit.edu/jwalden/www/isArray.html

IMHO, the only way to check type at runtime in JavaScript is duck typing AKA
object validation; that is, just checking all property are set as expected.


**rtti.js** is not a framework; this is merely a convention which implements
runtime type checking. Since **rtti.js** is not a framework, you can use
`rtti.js` even without the npm package.




 `makeValiFactory()`
--------------------------------------------------------------------------------
`makeValiFactory` is a helper function to create reliable validator functions:

```javascript
  const INFO   = Symbol.for( 'dump rtti.js information' ); 
  const create_info_gen_from_string = ( info_gen_string )=>{
    if ( typeof info_gen_string === 'string' ) {
      return ()=>info_gen_string;
    } else {
      throw new TypeError('found an invalid argument');
    }
  };

  const makeValiFactory = ( vali_gen, info_gen=(...defs)=>"unknown", chk_args=(...defs)=>{} )=>{
    if ( typeof info_gen === 'string' ) {
      info_gen = create_info_gen_from_string( info_gen );
    }
    return (...defs)=>{
      chk_args(...defs);
      const vali = vali_gen(...defs);
      const info = info_gen(...defs);
      return (o)=>o=== INFO ? info : vali(o);
    }
  };
```

#### The Definition of the Parameters ####

- `vali_gen` is a function to create the evaluator.
- `info_gen` is a function to create a string value to express the type name; can also be a string.
- `chk_args` is a function which offers a chance to check the arguments.


#### Example ####

The following example implements a null checker.

```javascript
  const null_checker = makeValiFactory(
    // a closure that does the evaluation
    (...defs)=>(o)=>o === null 

    // a closure that returns the name of the type
    (...defs)=>"null",

    // null checker takes no argument
    (...defs)=>{
      if ( defs.length !== 0 ) {
        throw new RangeError( 'no definition can be specified' );
      }
    }, 
  );
```


 Conclusion
--------------------------------------------------------------------------------
That's all. Thank you very much.


<!-- vim: set sw=2 sts=2 ts=2: -->
