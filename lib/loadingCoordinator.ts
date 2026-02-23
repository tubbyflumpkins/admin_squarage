/**
 * Loading Coordinator - Prevents multiple simultaneous API calls from dashboard widgets
 * 
 * This singleton service ensures that when multiple widgets try to load data
 * at the same time (e.g., on dashboard mount), only ONE API call is made.
 * All widgets share the response, dramatically reducing database connections.
 */

type LoadingPromise = Promise<any> | null

class LoadingCoordinator {
  private static instance: LoadingCoordinator
  private loadingPromises: Map<string, LoadingPromise> = new Map()
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 30000 // 30 second cache to prevent redundant reloads

  private constructor() {}

  static getInstance(): LoadingCoordinator {
    if (!LoadingCoordinator.instance) {
      LoadingCoordinator.instance = new LoadingCoordinator()
    }
    return LoadingCoordinator.instance
  }

  /**
   * Coordinates loading for a specific endpoint
   * If multiple components request the same endpoint simultaneously,
   * they'll share the same promise/response
   */
  async coordinatedLoad<T>(
    key: string,
    loadFn: () => Promise<T>,
    options: { bypassCache?: boolean } = {}
  ): Promise<T> {
    // Check cache first (unless bypassed)
    if (!options.bypassCache) {
      const cached = this.cache.get(key)
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {

        return cached.data as T
      }
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(key)
    if (existingPromise) {

      return existingPromise as Promise<T>
    }

    // Start new load

    const promise = loadFn()
      .then((data) => {
        // Cache the result
        this.cache.set(key, { data, timestamp: Date.now() })
        return data
      })
      .finally(() => {
        // Clear the loading promise
        this.loadingPromises.delete(key)
      })

    this.loadingPromises.set(key, promise)
    return promise as Promise<T>
  }

  /**
   * Clear cache for a specific key or all keys
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }
}

export const loadingCoordinator = LoadingCoordinator.getInstance()