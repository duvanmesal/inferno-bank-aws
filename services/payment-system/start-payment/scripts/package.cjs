// scripts/package.cjs  (para start-payment)

const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const { execSync } = require("child_process");

// Paths
const root = process.cwd();
const buildDir = path.join(root, ".build");
const distDir = path.join(root, "..", "..", "..", "dist", "lambdas");
const zipPath = path.join(distDir, "start-payment.zip");

const srcDir = path.join(root, "src");
const indexFile = path.join(root, "index.js");
const pkgFile = path.join(root, "package.json");

// Command: clean | build | package
const cmd = process.argv[2];

async function clean() {
  console.log("🧹 Cleaning .build for start-payment...");
  await fs.remove(buildDir);
}

async function build() {
  console.log("📦 Building start-payment Lambda...");

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
    stdio: "inherit"
  });

  console.log("✔ Build completed for start-payment.");
}

async function pack() {
  console.log("📦 Packaging start-payment.zip...");

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

  console.log("🎉 start-payment packaged successfully.");
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
    console.log("Usage: node scripts/package.cjs [clean|build|package]");
}
