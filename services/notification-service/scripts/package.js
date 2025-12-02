const archiver = require("archiver")
const fs = require("fs")
const path = require("path")

const distDir = path.join(__dirname, "..", "dist")
const zipPath = path.join(distDir, "notification-service.zip")

const output = fs.createWriteStream(zipPath)
const archive = archiver("zip", { zlib: { level: 9 } })

output.on("close", () => {
  console.log(`Package created: ${zipPath} (${archive.pointer()} bytes)`)
})

archive.on("error", (err) => {
  throw err
})

archive.pipe(output)

archive.directory(distDir, false, (entry) => {
  if (entry.name.endsWith(".zip") || entry.name.endsWith(".map")) {
    return false
  }
  return entry
})

const nodeModulesPath = path.join(__dirname, "..", "node_modules")
if (fs.existsSync(nodeModulesPath)) {
  archive.directory(nodeModulesPath, "node_modules")
}

archive.finalize()
