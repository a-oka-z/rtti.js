
import { sqlmacro } from 'sqlmacro';
import { readFile, writeFile } from 'fs/promises';


async function asyncProc(templateFilename, bodyFilename, outputFilename ){
  const template = (await readFile( templateFilename, 'utf-8' ));
  const body     = (await readFile( bodyFilename,     'utf-8' ));

  const output = sqlmacro([template])(body);

  await writeFile( outputFilename, output, 'utf-8' );
  return 'succeeded to compile modules';
}


asyncProc( 'template/index.template.cjs',      'index.js',      'lib/index.cjs'      ).then(v=>console.log(v)).catch(v=>console.error(v));
asyncProc( 'template/index.template.mjs',      'index.js',      'lib/index.mjs'      ).then(v=>console.log(v)).catch(v=>console.error(v));
asyncProc( 'template/transpiler.template.cjs',  'transpiler.js',  'lib/transpiler.cjs'  ).then(v=>console.log(v)).catch(v=>console.error(v));
asyncProc( 'template/transpiler.template.mjs',  'transpiler.js',  'lib/transpiler.mjs'  ).then(v=>console.log(v)).catch(v=>console.error(v));
asyncProc( 'template/index.test.template.cjs', 'index.test.js', 'lib/index.test.cjs' ).then(v=>console.log(v)).catch(v=>console.error(v));
asyncProc( 'template/index.test.template.mjs', 'index.test.js', 'lib/index.test.mjs' ).then(v=>console.log(v)).catch(v=>console.error(v));
