// scripts/package.js (CommonJS version for Windows)

const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const { execSync } = require("child_process");

// Paths
const root = process.cwd();
const buildDir = path.join(root, ".build");
const distDir = path.join(root, "..", "..", "..", "dist", "lambdas");
const zipPath = path.join(distDir, "payment-api.zip");

const srcDir = path.join(root, "src");
const indexFile = path.join(root, "index.js");
const pkgFile = path.join(root, "package.json");

// Commands
const cmd = process.argv[2]; // clean | build | package

async function clean() {
  console.log("🧹 Cleaning .build...");
  await fs.remove(buildDir);
}

async function build() {
  console.log("📦 Building Lambda...");

  await clean();

  await fs.ensureDir(buildDir);

  console.log("📁 Copying src...");
  await fs.copy(srcDir, path.join(buildDir, "src"));

  console.log("📄 Copying index.js & package.json...");
  await fs.copy(indexFile, path.join(buildDir, "index.js"));
  await fs.copy(pkgFile, path.join(buildDir, "package.json"));

  console.log("📥 Installing production dependencies...");
  execSync("npm install --only=production", {
    cwd: buildDir,
    stdio: "inherit",
  });

  console.log("✔ Build completed.");
}

async function pack() {
  console.log("📦 Packaging ZIP...");

  await build();
  await fs.ensureDir(distDir);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    console.log(`✔ Created ZIP: ${zipPath} (${archive.pointer()} bytes)`);
  });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(output);

  archive.directory(buildDir, false);

  await archive.finalize();

  console.log("🎉 Packaging done.");
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
    console.log("Usage: node scripts/package.js [clean|build|package]");
}
