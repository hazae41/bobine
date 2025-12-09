/// <reference lib="webworker" />

import "@hazae41/disposable-stack-polyfill";

import { immutable } from "@hazae41/immutable";

declare const self: ServiceWorkerGlobalScope

declare const CACHE: string
declare const FILES: [string, string][]

/**
 * Only cache on production
 */
// @ts-ignore: process not found
// deno-lint-ignore no-process-global
if (process.env.NODE_ENV === "production") {
  const cacher = new immutable.cache.Cacher(CACHE, new Map(FILES))

  self.addEventListener("install", (event) => {
    /**
     * Precache new version and auto-activate as the update was already accepted
     */
    event.waitUntil(cacher.precache().then(() => self.skipWaiting()))
  })

  self.addEventListener("activate", (event) => {
    /**
     * Take control of all clients and uncache previous versions
     */
    event.waitUntil(self.clients.claim().then(() => cacher.uncache()))
  })

  /**
   * Respond with cache
   */
  self.addEventListener("fetch", (event) => {
    const response = cacher.handle(event.request)

    if (response == null)
      return

    event.respondWith(response)
  })
}

// @ts-ignore: process not found
// deno-lint-ignore no-process-global
if (process.env.NODE_ENV === "development") {
  self.addEventListener("install", (event) => {
    /**
     * Auto-activate
     */
    event.waitUntil(self.skipWaiting())
  })

  self.addEventListener("activate", (event) => {
    /**
     * Take control of all clients
     */
    event.waitUntil(self.clients.claim())
  })
}