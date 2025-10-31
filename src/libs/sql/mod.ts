import type { Database } from "@tursodatabase/database";

export async function runAsImmediateOrThrow<T>(database: Database, callback: (database: Database) => Promise<T>) {
  await database.exec("BEGIN IMMEDIATE TRANSACTION;")

  try {
    const result = await callback(database)
    await database.exec("COMMIT;")
    return result
  } catch (e: unknown) {
    await database.exec("ROLLBACK;")
    throw e
  }
}

export async function runAsDeferredOrThrow<T>(database: Database, callback: (database: Database) => Promise<T>) {
  await database.exec("BEGIN DEFERRED TRANSACTION;")

  try {
    const result = await callback(database)
    await database.exec("COMMIT;")
    return result
  } catch (e: unknown) {
    await database.exec("ROLLBACK;")
    throw e
  }
}