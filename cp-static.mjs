import { writeFileSync, readFileSync } from 'node:fs';

const copyCss = () => {
    const cssFile = readFileSync('./src/grid.css', 'utf-8');
    writeFileSync('./cjs/grid.css', cssFile);
    writeFileSync('./esm/grid.css', cssFile);
}

copyCss();