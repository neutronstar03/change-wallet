import { mkdir, readFile, writeFile, copyFile, readdir } from "node:fs/promises";
import path from "node:path";

type SourceMapFile = {
  sources?: string[];
  sourcesContent?: Array<string | null>;
};

const workspaceRoot = process.cwd();
const extensionRoot = path.join(
  workspaceRoot,
  "recovered-extension",
  "dcncbippcdfiljhcfpdieipdjfjoaihl"
);
const outputRoot = path.join(workspaceRoot, "reconstructed-extension");
const srcRoot = path.join(outputRoot, "src");
const publicRoot = path.join(outputRoot, "public");
const metaRoot = path.join(outputRoot, "reconstruction-meta");

const copiedPublicFiles = ["manifest.json", "index.html", "logo.png", "favicon.ico", "robots.txt"];

const normalizeSourcePath = (source: string): string | null => {
  if (source.startsWith("../webpack/") || source.includes("node_modules/")) {
    return null;
  }

  if (source.startsWith("../") || source.startsWith("../../") || source.startsWith("./")) {
    return null;
  }

  if (source.startsWith("webpack://src/")) {
    return source.replace("webpack://src/", "src/");
  }

  if (source.startsWith("webpack:///src/")) {
    return source.replace("webpack:///src/", "src/");
  }

  if (source.startsWith("services/")) {
    return `src/${source}`;
  }

  if (!source.includes("/")) {
    return `src/${source}`;
  }

  return null;
};

const ensureDir = async (filePath: string): Promise<void> => {
  await mkdir(path.dirname(filePath), { recursive: true });
};

const readJson = async <T>(filePath: string): Promise<T> => {
  const text = await readFile(filePath, "utf8");
  return JSON.parse(text) as T;
};

const listMapFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listMapFiles(fullPath);
      }
      return entry.name.endsWith(".map") ? [fullPath] : [];
    })
  );

  return files.flat().sort();
};

const inferredTypesSource = `export type JsonRpcCallback = (
  error: unknown,
  response: JsonRpcResponse
) => void;

export type JsonRpcRequest = {
  id?: string | number;
  jsonrpc?: string;
  method: string;
  params?: unknown[] | Record<string, unknown>;
  [key: string]: unknown;
};

export type JsonRpcResponse = {
  id?: string | number;
  jsonrpc: string;
  method?: string;
  result?: unknown;
  error?: unknown;
  [key: string]: unknown;
};

export type ImpersonatorState = {
  address?: string;
  originalAddress?: string;
  mockedFunctionsUndoers: Record<string, () => void>;
  startImpersonation: (address: string, triggerAccountsChanged: boolean) => void;
  stopImpersonation: () => void;
};

export type EthereumProvider = {
  request: (args: { method: string; [key: string]: unknown }) => Promise<unknown>;
  send?: (
    methodOrPayload: string | JsonRpcRequest,
    paramsOrCallback: unknown[] | JsonRpcCallback
  ) => Promise<JsonRpcResponse> | void;
  sendAsync?: (payload: JsonRpcRequest, callback: JsonRpcCallback) => void;
  enable?: () => Promise<unknown>;
  emit: (event: string, payload: unknown) => void;
  selectedAddress?: string;
  [key: string]: unknown;
};

export type ExtendedWindow = Window & {
  ethereum: EthereumProvider;
  impersonator?: ImpersonatorState;
};
`;

const main = async (): Promise<void> => {
  await mkdir(outputRoot, { recursive: true });
  await mkdir(srcRoot, { recursive: true });
  await mkdir(publicRoot, { recursive: true });
  await mkdir(metaRoot, { recursive: true });

  const mapFiles = await listMapFiles(extensionRoot);
  const extracted = new Map<string, { content: string; sourceMap: string; originalSource: string }>();
  const duplicates: Array<{ path: string; maps: string[] }> = [];

  for (const mapFile of mapFiles) {
    const map = await readJson<SourceMapFile>(mapFile);
    const sources = map.sources ?? [];
    const sourcesContent = map.sourcesContent ?? [];

    sources.forEach((source, index) => {
      const normalized = normalizeSourcePath(source);
      const content = sourcesContent[index];

      if (!normalized || content == null) {
        return;
      }

      const existing = extracted.get(normalized);
      if (existing && existing.content !== content) {
        duplicates.push({
          path: normalized,
          maps: [existing.sourceMap, path.relative(workspaceRoot, mapFile)]
        });
        return;
      }

      extracted.set(normalized, {
        content,
        sourceMap: path.relative(workspaceRoot, mapFile),
        originalSource: source
      });
    });
  }

  for (const [relativePath, file] of extracted.entries()) {
    const outPath = path.join(outputRoot, relativePath);
    await ensureDir(outPath);
    await writeFile(outPath, file.content, "utf8");
  }

  const typesPath = path.join(srcRoot, "types.ts");
  if (!extracted.has("src/types.ts")) {
    await writeFile(typesPath, inferredTypesSource, "utf8");
  }

  for (const fileName of copiedPublicFiles) {
    const sourcePath = path.join(extensionRoot, fileName);
    const outPath = path.join(publicRoot, fileName);
    await ensureDir(outPath);
    await copyFile(sourcePath, outPath);
  }

  const manifest = {
    extensionRoot: path.relative(workspaceRoot, extensionRoot),
    outputRoot: path.relative(workspaceRoot, outputRoot),
    extractedFiles: [...extracted.entries()].map(([relativePath, file]) => ({
      path: relativePath,
      originalSource: file.originalSource,
      sourceMap: file.sourceMap
    })),
    inferredFiles: extracted.has("src/types.ts") ? [] : ["src/types.ts"],
    duplicateConflicts: duplicates,
    notes: [
      "Project sources were reconstructed from embedded sourcesContent in the local extension sourcemaps.",
      "Third-party node_modules sources and webpack bootstrap stubs were intentionally skipped.",
      "public/ contains copied runtime assets from the recovered unpacked extension."
    ]
  };

  await writeFile(
    path.join(metaRoot, "extraction-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
