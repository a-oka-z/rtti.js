import  { INFO, rtti, makeValiFactory, createTemplate, standardValis } from './index.mjs' ;



test('compiler test basic 1', ()=>{
  const factory = rtti`
    object(
      name : string(),
      age  : number(),
      field : or( number(), string() ),
      attrs : object(
        foo: string(),
        bar: number(),
      ),
      arr_test : array(
        not( number()),
      ),
    )
  `;
  expect( factory.script ).toBe(`
    rtti.object({
      name : rtti.string(),
      age  : rtti.number(),
      field : rtti.or( rtti.number(), rtti.string() ),
      attrs : rtti.object({
        foo: rtti.string(),
        bar: rtti.number(),
      }),
      arr_test : rtti.array(
        rtti.not( rtti.number()),
      ),
    })
  `.trim());

  const vali = factory();

  console.error({factory,vali});
});

test('compiler test basic 2', ()=>{
  expect( rtti`string()`()(INFO) ).toBe( 'string' );
  expect( rtti`number()`()(INFO) ).toBe( 'number' );

  expect( rtti`string()`()('hello') ).toBe( true  );
  expect( rtti`string()`()( 123   ) ).toBe( false );
  expect( rtti`number()`()( 123   ) ).toBe( true  );
  expect( rtti`number()`()('hello') ).toBe( false );
});

