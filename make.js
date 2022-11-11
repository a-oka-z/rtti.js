
import { sqlmacro } from 'sqlmacro';
import { readFile, writeFile } from 'fs/promises';


async function asyncProc(templateFilename, bodyFilename, outputFilename ){
  const template = (await readFile( templateFilename, 'utf-8' ));
  const body     = (await readFile( bodyFilename,     'utf-8' ));

  const output = sqlmacro([template])(body);

  await writeFile( outputFilename, output, 'utf-8' );
  return 'succeeded to compile modules';
}


asyncProc( 'index.template.cjs',      'index.js',      'index.cjs'      ).then(v=>console.log(v)).catch(v=>console.error(v));
asyncProc( 'index.template.mjs',      'index.js',      'index.mjs'      ).then(v=>console.log(v)).catch(v=>console.error(v));
asyncProc( 'index.test.template.cjs', 'index.test.js', 'index.test.cjs' ).then(v=>console.log(v)).catch(v=>console.error(v));
asyncProc( 'index.test.template.mjs', 'index.test.js', 'index.test.mjs' ).then(v=>console.log(v)).catch(v=>console.error(v));
