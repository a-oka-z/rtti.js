 **vanilla-schema-validator**
================================================================================ 

**vanilla-schema-validator** is a schema validator which is non-opinionated,
extensible, scalable and yet simple convention to check validity of an object
or/and to determine the runtime type of an specific object by duck-typing.

> Note that **vanilla-schema-validator** was formerly referred as 
> [rtti.js](https://www.npmjs.com/package/rtti.js) and renamed on Dec 27 2022.

```javascript
import  { schema } from 'vanilla-schema-validator';

console.error( schema.string()(  42  )); // false
console.error( schema.string()( '42' )); // true
console.error( schema.number()(  42  )); // true
console.error( schema.number()( '42' )); // false
```

Combining these functions enables you to validate more complex objects :

```javascript
import  { schema } from 'vanilla-schema-validator';

const t_person = schema.object({
  name    : schema.string(),
  age     : schema.number(),
  visited : schema.boolean(),
});

const obj1 = {
  name    :'John',
  age     : 42,
  visited : true,
};
console.error( t_person( obj1 ) ); // true
```

The functions that are defined in `schema` are merely factories of various
validators. In the example above, `schema.string` and `schema.number` are factories
of validators.

They are merely utilities and not requirement; you can create a validator
manually on the fly. For example, the following example works, too:

```javascript
import  { schema } from 'vanilla-schema-validator';

const t_person = schema.object({
  name    : schema.string(),
  age     : schema.number(),
  visited : schema.boolean(),
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


 Design Goal of **vanilla-schema-validator**
--------------------------------------------------------------------------------

The desigin concept of **vanilla-schema-validator** is based on my hypothesis
explains that in JavaScript, it is impossible to precisely determine a type of
an object via its run-time type information and `duck typing` is the only way
to accomplish it.

A Type in JavaScript is merely the least expectation to an object. For example,
if you get an object, you might expect that there is a property which name is
`product_id` and as long as there is the property, your code will work as you
expected; otherwise it won't. That is the least expectation to an object.

Its design goal is to exhaustively determine a type of an object in the sense
of described above, with the maximum coverage of those various corner cases
which occur caused via ambiguously defined JavaScript type system.

Especially the first concern of **vanilla-schema-validator** is by no means readability; if you
expect those sweet syntax suger with function chaining, this is not for you.


 The Basic Rules of the Convention of **vanilla-schema-validator**
--------------------------------------------------------------------------------

The convention of **vanilla-schema-validator** recommends the type determinors are formed by the
following three elements.

```javascript
  schema.string()('value')
  |  1  |   2    |   3   |
```

1. `Namespace` ... We call this part `Namespace` . A namespace object keeps a
   number of `Factory` which is explained in 2.
2. `Factory` ... We call this part `Factory`. A `Factory` is a function to create
   a `Validator` which is explained in 3.
3. `Validator` ... We call this part `Validator`. A `Validator` is a function
   which returns `true` if the given value is as expected; otherwise returns
   `false`.

If you define a factory of a validator as following :
```javascript
  schema.hello_validator = ()=>(o)=>o === 'hello';
```

you can use the validator as following:

```javascript
  schema.hello_validator()( 'hello' ) // returns true 
```


  `prevent-undefined`
--------------------------------------------------------------------------------

[prevent-undefined][] is a debugging tool that prevents generating `undefined`
values via accessing properties by incorrect property names.
`prevent-undefined` supports the convention of **vanilla-schema-validator**.

The way to use [prevent-undefined][] with **vanilla-schema-validator** is as following:

```javascript
const t_person_info = schema.object({
  name    : schema.string(),
  age     : schema.number(),
});

const preventUndefined = require('prevent-undefined');
const personInfo = getPersonInfoFromSomewhere();

const protectedPersonInfo = preventUndefined( personInfo, t_person_info() );

console.error( protectedPersonInfo.non_existent_prop  ); // throws an error

protectedPersonInfo.age = 'an invalid number' ; // throws an error
```

For further information, see [prevent-undefined][].

[prevent-undefined]:  https://www.npmjs.com/package/prevent-undefined


 Basic Validators
--------------------------------------------------------------------------------
**vanilla-schema-validator** offers some basic validators as default. These validators are there
only for your convenience; again, it is not mandatory to use them as long as
the functions you offer are following the **vanilla-schema-validator**'s convention.

Available validators are:

- undefined()
- null()
- boolean()
- number()
- string()
- bigint()
- symbol()
- function()
- any()
- or()
- and()
- not()
- object()
- array()
- equals()
- uuid()

Their usage may be self-descriptive; though, some of them should be explaind.


#### `undefined()` ####
Returns `true` if `typeof` operator to the given value returns `undefined`; otherwise returns `false`.
```javascript
schema.undefined()( undefined ) // returns true
schema.undefined()( null      ) // returns false
```

#### `null()` ####
Returns `true` if the given value is strictly equal to `null` value; otherwise returns `false`.
```javascript
schema.null()( null ) // returns true
schema.null()( 1    ) // returns false
```

#### `boolean()` ####
Returns `true` if `typeof` operator to the given value returns `boolean`; otherwise returns `false`.
```javascript
schema.boolean()( false  ) // returns true
schema.boolean()( true   ) // returns true
schema.boolean()( 'true' ) // returns false
```

#### `number()` ####
Returns `true` if `typeof` operator to the given value returns `number`; otherwise returns `false`.
```javascript
schema.number()( 42 ) // returns true
schema.number()('42') // returns false
```

#### `string()` ####
Returns `true` if `typeof` operator to the given value returns `string`; otherwise returns `false`.
```javascript
schema.string()( '42' ) // returns true
schema.string()(  42  ) // returns false
```

#### `bigint()` ####
Returns `true` if `typeof` operator to the given value returns `bigint`; otherwise returns `false`.
```javascript
schema.bigint()( BigInt(42) ) // returns true
schema.bigint()(        42  ) // returns false
```

#### `symbol()` ####
Returns `true` if `typeof` operator to the given value returns `symbol`; otherwise returns `false`.
```javascript
schema.symbol()( Symbol('hello')     ) // returns true
schema.symbol()( Symbol.for('hello') ) // returns true
schema.symbol()(            'hello'  ) // returns false
```

#### `function()` ####
Returns `true` if `typeof` operator to the given value returns `function`; otherwise returns `false`.
```javascript
schema.function()( ()=>{}        ) // returns true
schema.function()( function(){}  ) // returns true
schema.function()( new Function()) // returns true
schema.function()( 'function'    ) // returns false
```

#### `any()` ####
`any()` always return `true` no matter which type of a value is specified as a
parameter.
```javascript
schema.any()( '123' );  // returns true
schema.any()(  123  );  // returns true
schema.any()( true  );  // returns true
```

#### `or()` ####
`or()` calls specified validators from left to right and returns `true` if at
least one of the validators return `true`.  
```javascript
schema.or( schema.string(), schema.number())( '123' );  // returns true
schema.or( schema.string(), schema.number())(  123  );  // returns true
schema.or( schema.string(), schema.number())( true  );  // returns false
```

#### `and()` ####
`and()` calls specified validators from left to right and return `true` if and only if 
all of the specified validators return `true`; otherwise returns `false`.
```javascript
schema.and( schema.number() , (v)=>100<v )( 200 ); // returns true
schema.and( schema.number() , (v)=>100<v )(  50 ); // returns false
```

#### `not()` ####
`not()` negates the result of the specified validator.
```javascript
schema.not( schema.number() )(  100  ); // returns false
schema.not( schema.number() )( '100' ); // returns true
```

#### `object()` ####
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
const t = schema.object({
  foo : schema.number(),
  bar : schema.string(),
});

t({
}); // returns false

t({
  foo: 100,
  bar: "100",
}); // returns true

```

#### `array()` ####
`array()` takes a number of validators as arguments, then, at the validation,
invokes each validator with its corresponding element in the target array
object.  If the all validators return `true`, `array()` returns `true`;
otherwise returns `false`.

If the number of elements in the target array is not equal to the number of
specified validators, this validator returns `false`.  **v1.0.0**


```javascript
  const validator = schema.compile`
    array(
      equals( <<'a'>> ),
      equals( <<'b'>> ),
      equals( <<'c'>> ),
      )`();

  console.log( validator(['a','b','c']) ); // true 
  console.log( validator(['a','b','d']) ); // false 
  console.log( validator(['a','b','c', 'd' ])); //true 
  console.log( validator(['a','b'          ])); // false 
```

##### Compatibility Note #####

1. Prior to **v1.0.0**, this validator was refererred  as `array_of()`.
2. Prior to **v1.0.0**, this validator did not check the number of elements : 

> If the number of elements in the target array is greater than the number of the
> specified validators, `array()` ignores the remaining elements.
> 
> If the number of elements in the target array object is less than the number of
> validators given in the parameter, this validator returns `false`.
 
#### `array_of()` ####
`array_of()` checks if all of the elements of the given array object conform to a
specified validator. `array_of()` receives a validator and call it with the all of
the elements on the specified array object. Return `true` if all elements conform
to the validator; otherwise return `false`.

```javascript
schema.array_of(schema.number())([1,2,3]); // return true
schema.array_of(schema.number())([1,2,'3']); // return false
schema.array_of(schema.or( schema.string(), schema.number()))([1,2,'3']); // return true
```

##### Compatibility Note #####
1. Prior to **v1.0.0**, this validator was refererred  as `array()`.


#### `equals()` ####
`equals()` takes a parameter as a target value and creates a validator which
compares with the target value. The validator returns `true` if and only if
the given value is strictly equal to the target value.
```javascript
schema.equals(1)(1); // true
schema.equals(1)('1'); // false
```

#### `uuid()` ####
`uuid()` checks if the given value conforms to the specification of [uuid][].

[uuid]: https://en.wikipedia.org/wiki/Universally_unique_identifier

```javascript
schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e67' ) // true
schema.uuid()( 'hello' ) // false
schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7m37e67' ) // false
schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e677' ) // false
schema.uuid()( '2a945d9d-2cfb423b-afb2-362ea7c37e677' ) // false
```

`uuid()` checks if the given value is a string; returns `false` if the given
value is not a string.

```javascript
schema.uuid()( 1  ) // false
schema.uuid()( false ) // false
```


 Create Validators via Statement Script Compiler
--------------------------------------------------------------------------------
The `schema` offers a template literal function which is called Statement
Script Compiler.  Statement compiler helps to build various validators:

```javascript
const type = schema.compile`
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

In this document, sometimes a reference to `schema` object is called `namespace`.
In JavaScript, in order to build complex validators, it is necessary to specify
a desired namespace reference everytime you refer the validator factories. In
Statement Script, it is possible to omit the namespace specifier.

The statement compiler may help you to build your validators with less
boilerplate.

**a note for backward compatibility** : former to v0.1.2, `schema` object can be
used as a template literal function. This behavior is deprecated. Though it is
still available to be used as a template literal, this will be removed in the
future version. The new project should not rely on this behavior.


 JavaScript Values in Statement Compiler
--------------------------------------------------------------------------------
In the statemet string, regions surrounded by `<<` and `>>` are treated as 
raw JavaScript values.

For example,

```javascript
const type = schema.compile`
  object(
    foo : equals( <<  42  >> ),
    bar : equals( << '42' >> ),
  )
`;

is loosely compiled to

```javascript
const type = schema.object({
  foo : schema.equals(  42  ),
  bar : schema.equals( '42' ),
})
```

 Extending Template Literal Validator Builder
--------------------------------------------------------------------------------
You can add your own validators by setting factorys of your desired validators
as properties on the `schema` object.

```javascript
const type = schema.compile`
  object(
    foo : Foo(),
    bar : Bar(),
  )
`();

schema.Foo = (...defs)=>(o)=>typeof o ==='number';
schema.Bar = (...defs)=>(o)=>typeof o ==='string';

const v = {
  foo:42,
  bar:'hello',
};
console.error( type( v ) ); // true;
```

**Correction** in `v0.1.6`, this part has been corrected. It is necessary to
set factories of validators, not validators themself.


 Create Your Own Namespace for **vanilla-schema-validator** 
--------------------------------------------------------------------------------
You usually don't want to set your own evaluators to the global `schema` object
because setting to the global `schema` object causes id confliction with the
other projects. In order to avoid confliction, you can create your own `schema`
object by `clone()` method.

```javascript
import  { schema } from 'vanilla-schema-validator';

const schema2 = schema.clone();

schema2.Foo = (...defs)=>(o)=>typeof o ==='number';
schema2.Bar = (...defs)=>(o)=>typeof o ==='string';

const type2 = schema2.compile`
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


const type1 = schema.compile`
  object(
    foo : Foo(),
    bar : Bar(),
  )
`();
console.error( type1( v ) ); // error;
```


 `make_vali_factory()`
--------------------------------------------------------------------------------
`make_vali_factory` is a helper function to create a reliable validator function:

```javascript
  const INFO   = Symbol.for( 'dump information' ); 
  const create_info_gen_from_string = ( info_gen_string )=>{
    if ( typeof info_gen_string === 'string' ) {
      return ()=>info_gen_string;
    } else {
      throw new TypeError('found an invalid argument');
    }
  };

  const make_vali_factory = ( vali_gen, info_gen=(...defs)=>"unknown", chk_args=(...defs)=>{} )=>{
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
  const null_checker = make_vali_factory(
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

#### Compatibility Note ####


##### `makeValiFactory()` #####
At the version **v0.1.5** `makeValiFactory()` was renamed to
`make_vali_factory()`. Even though  `makeValiFactory()` is still available, new
projects should not use it.


##### Renamed `array()` and `array_of()`  #####
At the version **v1.0.0** the identifiers `array()` and `array_of()` are
renamed so that `array_of` becomes `array` and `array()` becomes `array_of()`
for the sake of naming consistency.



  History
--------------------------------------------------------------------------------
- v0.1.0 released
- v0.1.1 added `uuid()` `equals()`
- v0.1.2 added `clone()`; the template literal function as `rtti.statement`
- v0.1.3 added `any()`
- v0.1.4 added << >> blocks.
- v0.1.5 statement compiler switches namespaces depends on how the validator
         factory  is called.
- v0.1.6 added `array_of()` validator.
         some document correction is also done.
         (Thu, 17 Nov 2022 16:44:33 +0900)
- v0.1.7 more informative error messages
         (Fri, 18 Nov 2022 11:56:11 +0900)
- v0.1.8 more informative error messages
         (Fri, 18 Nov 2022 17:32:01 +0900)
- v1.0.0 The identifiers `array()` and `array_of()` are swapped. Now `array()`
  is called `array_of()` while `array_of()` is called `array()`. This breaks
  backward compatibility.

- v1.0.1 Fixed the broken `array()` validator .

- v1.0.2 Fixed `README.md`.

- v2.0.0 **vanilla-schema-validator** is released.
         (Tue, 27 Dec 2022 17:48:41 +0900)

         **rtti.js** has been renamed to **vanilla-schema-validator**.  
         npm package **rtti.js** is deprecated.
         Updated on (Wed, 14 Dec 2022 14:38:18 +0900)

         `rtti.statement` is renamed `schema.compile`.
         `vanilla-schema-validator` is one-hundred percent backward compatible
         with former `rtti.js` though.
         Updated on (Tue, 27 Dec 2022 17:33:45 +0900)
- v2.0.1 fixed the issue that `statement compiler` throws an error when a comma
         is placed after all statements.


 Conclusion
--------------------------------------------------------------------------------
This documentation is not perfect and there are still a lot of things which
should be on this document.

Thank you very much for your attention.

[Atsushi Oka][] / I'm from Tokyo. For further information, see my github account.

[Atsushi Oka]: https://github.com/a-oka-z/


<!-- vim: set sw=2 sts=2 ts=2: -->
