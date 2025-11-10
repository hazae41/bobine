import { mkdirSync, symlinkSync, writeFileSync } from "node:fs";

mkdirSync(`./local/scripts`, { recursive: true })

writeFileSync("./local/scripts/a.txt", "aaa")

// mkdirSync(`./local/scripts`, { recursive: true })

// writeFileSync("./local/scripts/b.txt", "bbb")

console.log("Files created")

await new Promise((resolve) => setTimeout(resolve, 1000))

// writeFileSync("./local/scripts/a.txt", "aaa")

// mkdirSync(`./local/scripts`, { recursive: true })

// rmSync("./local/scripts/b.txt", { force: true })

symlinkSync("./a.txt", "./local/scripts/b.txt", "file")

console.log("Symlink created")
