 prevent-undefined
=====================

`prevent-undefined` throws an error to let you know that you accidentally refer an undefined propery on your object.

It also displays dump of the refered object for your convenience. See below :

```javascript
const  { preventundefined } = require("prevent-undefined" );
// or
import { preventUndefined } from "prevent-undefined";

// foo.js
  const someObj = {
    hello : {
      world : {
        foo : {
          bar : {
            baz : "HELLO",
          },
        }
      }
    }
  };

  preventUndefined( someObj ).hello.world.foo.bar.VAZ;
  //                                 SOME TYPO    ^^^
```

then, you'll get:

```javascript
> node foo.js
ReferenceError: obj.hello.world.foo.bar.VAZ is not defined in {
  hello: {
    world: { foo: { bar: { baz: 'HELLO' } } }
  }
}
```


 The Major Usecase of `preventUndefined`
--------------------------------------------------------------------------------
The major usecase of `preventUndefined` is checking validity of named parameter
values:

```javascript
function someFunc(args){
  const {foo,bar} = preventUndefined(args);
  console.error("foo:",foo);
}

someFunc({wrongArg1:"foo", wrongArg2:"bar";});

> ReferenceError: obj.foo is not defined in {
>   "wrongArg1": "foo",
>   "wrongArg2": "bar"
> }
```

 unprevent()
--------------------------------------------------------------------------------

Sometimes, you will want to unprevent your objects especially when you want to
use [optional chaining][]:

```javascript
const { preventUndefined } = require('./common.js');
const someObj = {
  hello : {
    world : {
      foo : {
        bar : {
          baz : {
            message : "HELLO",
          }
        },
      }
    }
  }
};
const o = preventUndefined( someObj );

function proc(o){
  return o.hello?.world?.foo?.bar?.baz?.value ?? "hello world";
}
proc(o);
```
you'll get

```javascript
ReferenceError: obj.hello.world.foo.bar.baz.value is not defined in {
  hello: {
    world: {
      foo: { bar: { baz: { message: 'HELLO' } } }
    }
  }
}
    at Object.get (/.../common.js:91:17)
```

which you definitely don't want.

Use `unprevent()`

```javascript
const  { unprevent } = require("prevent-undefined/common.js");
function proc(o){
  o=unprevent(o);
  return o.hello?.world?.foo?.bar?.baz?.value ?? "hello world";
}
proc(o); // you'll get "hello world" as expected.
```

[optional chaining]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining


 errorIfUndefined() **ADDED v0.2.19**
--------------------------------------------------------------------------------
`errorIfUndefined()` is a perfect fancy mascot to implement 
''prevent-undefined way'' of named parameters. When you call `errorIfUndefined()`,
it simply throws ReferenceError(). Its only use case is as following :

```javascript
function strictFunc({foo=errorIfUndefined('foo')}) {
  console.error(foo);
}
strictFunc({ foo_WITH_TYPO: 'foo' });

> ReferenceError: the parameter value of foo was undefined; any reference to an undefined value is strictly prohibited on this object.   
```

`errorIfUndefined` takes only one parameter : `name` which is to specify the name of the parameter.



 recursivelyUnprevent() **ADDED v0.2.19**
--------------------------------------------------------------------------------
`recursivelyUnprevent()` recursively unprevent the specified object, literally.
Currently `recursivelyUnprevent()` is in the beta state; therefore, please use
this with care. Currently, this does not check any circular references.


 preventUnusedProperties()  **ADDED v0.2.20**
--------------------------------------------------------------------------------
The basic idea is :
```javascript
// There is a func as :
function someFunc({foo,bar}){
  console.error("foo:",foo);
  console.error("bar:",bar);
  // note that `baz` is not used at all.
}

var foo = 'foo';
var bar = 'bar';
var baz = 'baz'; 
// `baz` a property which the caller thinks it is valid but actually isn't.
someFunc({foo,bar,baz});

> foo: foo
> bar: bar

// You'll get `foo` `bar` without getting any error that sucks.
```

In order to prevent such tiredness, use `preventUnusedProperties()`.

```javascript
function someFunc(args){
  // Prevent undefined on the `args` object before destructuring it.
  const {foo,bar} = preventUndefined(args);

  // After destructured the `args` object, call `preventUnusedProperties()`
  preventUnusedProperties(args);

  console.error("foo:",foo);
  console.error("bar:",bar);
}

var foo = 'foo';
var bar = 'bar';
var baz = 'baz';
someFunc({foo,bar,baz});


> ReferenceError: the field [baz] was not referred in
> {
>   "foo": "foo",
>   "bar": "bar",
>   "baz": "baz"
> }
```


 The Basic Idea of `prevent-unprevent`
--------------------------------------------------------------------------------
IMHO, `undefined` is always evil:

```javascript
  // you defined some procedures :
  function showName(name){
    if (name.length<10) {
      console.error( "a short name", name );
    } else {
      console.error( "a long name", name );
    }
  }
  function foo(guy) {
    showName(guy.name);
  }

  // then, you have some data:
  const guy1 = getYourDataFromResource('john');
  const guy2 = getYourDataFromResource('paul');

  // then, you want to exec the procedures with your data:
  foo(guy1)
  foo(guy2);

  // and if you misteriously get ReferenceError as

  > TypeError: Cannot read properties of undefined (reading 'length')
  > at showName (..) file.js:17:14
  > ...
```

At this point, you have no clue where the problem came from. At this point, you
will never notice that some junkie made a function as following:

```javascript
  const jOhN ={
    NAME:'John',
    AGE: 18,
  };
  const pAul ={
    NAME:'Paul',
    AGE: 23,
  };

function getYourDataFromResource(id) {
  if ( id === 'john' ) {
    return {
      name : jOhN.namee;
    }
  } else if ( id ==='PaUL' ) {
    return {
      name : pAul.naame;
    }
  }
}
```

Even though the problem is obviously occured inside the function
`getYourDataFromResource()` you will only get the error from a totaly
irrelevant function `showName()` which is very confusing and annoying.

The language should actually throw an Error where the `undefined` comes out.

IMHO, `undefined` is always poisoneous; the language system should have never
allow the existence of `undefined`. In spite of the difficulty, the current
specification of ECMA Script cannot detect undefined properties even if you
enable 'use strict'.

This is where `prevent-undefined` come in.

```javascript
const jOhN = preventUndefined({
  NAME:'John',
  AGE: 18,
});

const pAul = preventUndefined({
  NAME:'Paul',
  AGE: 23,
});

function getYourDataFromResource(id) {
  if ( id === 'john' ) {
    return {
      name : jOhN.namee; // this throws error.
    }
  } else if ( id ==='PaUL' ) {
    return {
      name : pAul.naame; // this throws error, too.
    }
  }
}
```

When you applied `prevent-undefined` in this way, you can easily indicate where
the problematic `undefined` comes from. 

IMHO, you should always avoid referencing undefined properties for any form.

Write not like this:

```javascript
if ( o.foo ) {
  console.error( 'foo exists' );
}
```

Write like this:

```javascript
if ( 'foo' in o  ) {
  console.error( 'foo exists' );
}
```

Because the conditional check `o.foo` implicitly references `undefined` which
makes detecting `undefined` very difficult.

```javascript

// if the o was get preventUndefined()ed somewhere before:
if ( o.foo ) { // this throws ReferenceError()
  console.error( 'foo exists' );
}
```

Unfortunately some functions from the standard JavaScript library use implicit
referencing `undefined`; for example,

```javascript
const o = preventUndefined( {hello:1})

// The following code will end up ReferenceError which led our `preventUndefined()` to
// ignore `then` with some hard-coding.
Promise.resolve( o );
```

That is, if you have found some standard functions that implicitly refers
`undefined` it is necessary to add the name of the property to the ignore list
which is hard-coded in `prevent-undefined` module.



 History 
--------------------------------------------------------------------------------

#### v0.2.6 ####
This didn't work; it didn't support common.js.

#### v0.2.7 ####
(may) supports both common.js and es6 module.

Special thanks goes to [How to Create a Hybrid NPM Module for ESM and CommonJS.](https://www.sensedeep.com/blog/posts/2021/how-to-create-single-source-npm-module.html)
This site helped a lot. Thank you very much.

#### v0.2.8 ####
(Fri, 14 Oct 2022 19:53:18 +0900)

Supported unpreventing null
```
unprevent( null ) == null
```

#### v0.2.9 ####
Fixed an issue that it throws TypeError when a symbol property is accessed.

#### v0.2.10 ####
Added keywords to ignore such as toJSON, `Symbol.toStringTag`,
`Symbol.toPrimitive` , etc.

#### v0.2.11 ####
Added `$$typeof` to the ignore keyword list to let `prevent-undefined` work
cooperatively  with `React.js`.

This very informative article [Why Do React Elements Have a $$typeof Property?][$$typeof] 
helped me to understand the problem. Thank you very much.

[$$typeof]: https://overreacted.io/why-do-react-elements-have-typeof-property/ 

#### v0.2.12 ####
`v0.2.11` does not work as an ES6 module due to my carelessness.  The problem
was fixed n this version.

#### v0.2.13 ####
Skipped the version `v0.2.13` via fear of Friday the 13th.  This version have
never been released.

#### v0.2.14 ####
In the version `v0.2.11`, I documented, commented, and tested it without
modifying the actual code.  Believe me, this time I actually modified.

#### v0.2.15 ####
- Added standard well-known symbols to ignore list; they are to added since
  they are likely to be checked as 
```
const i = a[Symbol.iterator];
if (i === undefined ) {
  // ...
}
```

  which is not a preferable behavior for this module.

- Applied automated code generation for tests.


#### v0.2.16 ####
Changed the way to check if the object is a symbol or not.

#### v0.2.17 ####
(Mon, 24 Oct 2022 17:40:53 +0900)

Added '@@iterator' to the ignore list in order to avoid an issue that will
occur when use this module with `React.js`.

#### v0.2.18 ####
(Thu, 03 Nov 2022 17:11:29 +0900)
Removed a unnecessarily left unremoved debug logging output.

#### v0.2.19 ####
(Mon, 07 Nov 2022 16:17:06 +0900)
Added `recursivelyUnprevent()` and `errorIfUndefined()`


#### v0.2.20 ####
(Wed, 09 Nov 2022 15:52:32 +0900)
Added `preventUnusedProperties()`
Updated README.md; added a section `The Basic Idea of preventUndefined()`.

#### v0.2.21 ####
(Wed, 09 Nov 2022 16:01:54 +0900)
Updated README.md.

#### v0.2.22 ####
(Wed, 09 Nov 2022 16:11:21 +0900)
Updated README.md.

 Conclusion
--------------------------------------------------------------------------------
That's all. Thank you very much.


