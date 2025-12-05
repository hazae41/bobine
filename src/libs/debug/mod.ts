import process from "node:process";

export const log = process.env.NODE_ENV === "development"
  ? (message: string) => console.debug(message)
  : null