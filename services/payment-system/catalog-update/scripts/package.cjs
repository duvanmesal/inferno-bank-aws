const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const { execSync } = require("child_process");

const root = process.cwd();
const buildDir = path.join(root, ".build");
const distDir = path.join(root, "..", "..", "..", "dist", "lambdas");
const zipPath = path.join(distDir, "catalog-update.zip");

const srcDir = path.join(root, "src");
const indexFile = path.join(root, "index.js");
const pkgFile = path.join(root, "package.json");

const cmd = process.argv[2];

async function clean() {
  await fs.remove(buildDir);
}

async function build() {
  await clean();
  await fs.ensureDir(buildDir);

  await fs.copy(srcDir, path.join(buildDir, "src"));
  await fs.copy(indexFile, path.join(buildDir, "index.js"));
  await fs.copy(pkgFile, path.join(buildDir, "package.json"));

  execSync("npm install --only=production", {
    cwd: buildDir,
    stdio: "inherit"
  });
}

async function pack() {
  await build();
  await fs.ensureDir(distDir);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(buildDir, false);

  await archive.finalize();
}

switch (cmd) {
  case "clean":
    clean();
    break;
  case "build":
    build();
    break;
  case "package":
    pack();
    break;
  default:
    console.log("Usage: node scripts/package.cjs clean|build|package");
}
