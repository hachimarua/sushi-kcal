import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const distDir = 'dist';
const files = [
  'index.html',
  'styles.css',
  'app.js',
  'sw.js',
  'manifest.webmanifest',
  'data/menu-items.js',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

await rm(distDir, { force: true, recursive: true });

for (const file of files) {
  const destination = join(distDir, file);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(file, destination);
}

await writeFile(join(distDir, '.nojekyll'), '');

console.log(`Built ${files.length} files into ${distDir}/`);
