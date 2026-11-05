import { watch } from 'node:fs';
import { cp, mkdir, readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'dist');
const jsDir = path.join(outDir, 'static', 'js');
const cssDir = path.join(outDir, 'static', 'css');

const entrypoints = [
  { name: 'index', path: path.join(root, 'src', 'index.tsx') },
  { name: 'background', path: path.join(root, 'src', 'services', 'background.ts') },
  { name: 'content', path: path.join(root, 'src', 'services', 'content.ts') },
  { name: 'inpage', path: path.join(root, 'src', 'services', 'inpage.ts') },
];

const moveOutputs = async (tempDir: string) => {
  const files = await readdir(tempDir);
  for (const file of files) {
    const from = path.join(tempDir, file);
    if (file.endsWith('.css') || file.endsWith('.css.map')) {
      await rename(from, path.join(cssDir, file));
      continue;
    }
    await rename(from, path.join(jsDir, file));
  }
};

const buildEntrypoint = async (name: string, entrypoint: string) => {
  const tempDir = path.join(outDir, `.tmp-${name}`);
  await mkdir(tempDir, { recursive: true });

  const result = await Bun.build({
    entrypoints: [entrypoint],
    outdir: tempDir,
    naming: `${name}.[ext]`,
    target: 'browser',
    sourcemap: 'external',
    minify: false,
    splitting: false,
  });

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log);
    }
    throw new Error(`Build failed: ${name}`);
  }

  await moveOutputs(tempDir);
  await rm(tempDir, { recursive: true, force: true });
};

const main = async () => {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(jsDir, { recursive: true });
  await mkdir(cssDir, { recursive: true });

  await cp(path.join(root, 'public'), outDir, { recursive: true });

  for (const entrypoint of entrypoints) {
    await buildEntrypoint(entrypoint.name, entrypoint.path);
  }
};

const reportError = (error: unknown) => {
  console.error(error);
};

await main();
if (process.argv.includes('--watch')) {
  let pending = false;
  let building = false;
  const rebuild = async () => {
    pending = true;
    if (building) {
      return;
    }
    building = true;
    while (pending) {
      pending = false;
      await main().then(() => console.log('Built dist/')).catch(reportError);
    }
    building = false;
  };
  for (const directory of ['src', 'public']) {
    watch(path.join(root, directory), { recursive: true }, () => {
      void rebuild();
    });
  }
  console.log('Watching src/ and public/. Reload the extension after each build.');
}
