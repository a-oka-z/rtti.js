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
validators. They are merely utilities and not requirement; you can create
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



 Basic Validators
--------------------------------------------------------------------------------
`rtti.js` offers some basic validators as default. These validators are there
only for your convenience; again, it is not mandatory to use them.

Available validators are:

- undefined()
- null()
- boolean()
- number()
- string()
- bigint()
- symbol()
- function()
- or()
- and()
- not()
- object()
- array()
- equals()
- uuid()

Their usage may be self-descriptive; though, some of them should be explaind.


#### undefined() ####
Returns `true` if `typeof` operator to the given value returns `undefined`; otherwise returns `false`.
```javascript
undefined()
```

#### null() ####
Returns `true` if the given value is strictly equal to `null` value; otherwise returns `false`.
```javascript
null()
```

#### boolean() ####
Returns `true` if `typeof` operator to the given value returns `boolean`; otherwise returns `false`.
```javascript
boolean()
```

#### number() ####
Returns `true` if `typeof` operator to the given value returns `number`; otherwise returns `false`.
```javascript
number()
```

#### string() ####
Returns `true` if `typeof` operator to the given value returns `string`; otherwise returns `false`.
```javascript
string()
```

#### bigint() ####
Returns `true` if `typeof` operator to the given value returns `bigint`; otherwise returns `false`.
```javascript
bigint()
```

#### symbol() ####
Returns `true` if `typeof` operator to the given value returns `symbol`; otherwise returns `false`.
```javascript
symbol()
```

#### function() ####
Returns `true` if `typeof` operator to the given value returns `function`; otherwise returns `false`.
```javascript
function()(()=>{}) // returns true
```

#### or() ####
`or()` calls specified validators from left to right and returns `true` if at
least one of the validators return `true`.  
```javascript
or( string(), number())( '123' );  // returns true
or( string(), number())(  123  );  // returns true
or( string(), number())( true  );  // returns false
```

#### and() ####
`and()` calls specified validators from left to right and return `true` if and only if 
all of the specified validators return `true`; otherwise returns `false`.
```javascript
and( number() , (v)=>100<v )( 200 ); // returns true
and( number() , (v)=>100<v )(  50 ); // returns false
```

#### not() ####
`not()` negates the result of the specified validator.
```javascript
not( number() )(  100  ); // returns false
not( number() )( '100' ); // returns true
```

#### object() ####
`object()` checks the validity of the given object. `object()` receives objects
as its parameters and takes them as definition of the object properties and
create a validator.

The definition objects should contain validators as their properties and these
validators are to be called when the validator performs comparison.

The validator will scan all properties which defined in the definition objects,
then call them with corresponding property values on the object to be compared.

the validator returns `true` if and only if all of the validators returns `true`;
otherwise, returns `false`.

```javascript
const t = object({
  foo : number(),
  bar : string(),
});

t({
}); // returns false

t({
  foo: 100,
  bar: "100",
}); // returns true

```

#### array() ####
`array()` checks if all of the elements of the given array object conform to a
specified validator. `array()` receives a validator and call it with the all of
the elements on the specified array object. Return `true` if all elements conform
to the validator; otherwise return `false`.

```javascript
array(number())([1,2,3]); // return true
array(number())([1,2,'3']); // return false
array(or( string(), number()))([1,2,'3']); // return true
```

#### equals() ####
`equals()` takes a parameter as a target value and creates a validator which
compares with the target value. The validator returns `true` if and only if
the given value is strictly equal to the target value.
```javascript
equals(1)(1); // true
equals(1)('1'); // false
```

#### uuid() ####
`uuid()` checks if the given value conforms to the specification of [uuid][].

[uuid]: https://en.wikipedia.org/wiki/Universally_unique_identifier

```javascript
rtti.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e67' ) // true
rtti.uuid()( 'hello' ) // false
rtti.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7m37e67' ) // false
rtti.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e677' ) // false
rtti.uuid()( '2a945d9d-2cfb423b-afb2-362ea7c37e677' ) // false
```

`uuid()` checks if the given value is a string; returns `false` if the given
value is not a string.

```javascript
rtti.uuid()( 1  ) // false
rtti.uuid()( false ) // false
```





 Create Validators via a Template Literal Validator Builder
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

I hope the syntax of the validator builder is simple enough to appear obvious
to you. The validator builder save you some of your finger power.


 Extending Template Literal Validator Builder
--------------------------------------------------------------------------------
You can add your own validators by setting them as a property on the template
literal function:

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

 Create Your Own Template Literal Validator Builder
--------------------------------------------------------------------------------
You usually find yourself to avoid setting on the global `rtti` function; you
can create your own to avoid conflict.

```javascript
import  { rtti, newRtti } from './index.mjs';

const rtti2 = Object.assign( newRtti(), rtti);

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
- `info_gen` is a function to create a string value to express the type name;
  can also be a string.
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


  History
--------------------------------------------------------------------------------
- v0.1.0 released
- v0.1.1 added `uuid()` `equals()`



 Conclusion
--------------------------------------------------------------------------------
This documentation is not perfect and there are still a lot of things which
should be on this document.

Thank you very much for your attention. I will be seeing you.

<!-- vim: set sw=2 sts=2 ts=2: -->
