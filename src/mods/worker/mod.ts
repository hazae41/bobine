export function spawn(uuid: string, data: string) {
  const url = new URL(import.meta.resolve("./bin.ts"))

  url.searchParams.set("uuid", uuid)

  url.searchParams.set("data", data)

  return new Worker(url, { type: "module" })
}
