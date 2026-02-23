import { loadingCoordinator } from './loadingCoordinator'

/**
 * Configuration for the load/save boilerplate that every entity store shares.
 *
 * TState must include `isLoading` and `hasLoadedFromServer`.
 */
export interface EntityStoreConfig<TState> {
  /** Key for loadingCoordinator dedup (e.g. 'todos-data') */
  coordinatorKey: string
  /** API route path (e.g. '/api/todos/neon') */
  endpoint: string
  /** Include credentials in fetch (default: true) */
  credentials?: boolean
  /** Debounce delay in ms for saves (default: 5000) */
  debounceMs?: number
  /** Parse API GET response into partial state to merge */
  parseResponse: (data: any, state: TState) => Partial<TState>
  /** Serialize current state into POST body */
  serializeState: (state: TState) => Record<string, any>
  /** Optional hook called after a successful load (e.g. create defaults) */
  afterLoad?: (
    get: () => TState,
    set: (partial: Partial<TState> | ((s: TState) => Partial<TState>)) => void
  ) => void
  /** Optional hook called after a successful save (e.g. clear caches) */
  afterSave?: () => void
}

type LoadingState = {
  isLoading: boolean
  hasLoadedFromServer: boolean
}

/**
 * Creates `loadFromServer`, `saveToServer`, and loading-state defaults
 * for a Zustand store. Spread the result inside `create((set, get) => ...)`.
 *
 * Usage:
 * ```ts
 * const loadSave = createEntityStoreSlice<MyStore>({ ... })
 * const useMyStore = create<MyStore>((set, get) => ({
 *   ...loadSave(set, get),
 *   // entity-specific state & actions
 * }))
 * ```
 */
export function createEntityStoreSlice<TState extends LoadingState>(
  config: EntityStoreConfig<TState>
) {
  const {
    coordinatorKey,
    endpoint,
    credentials = true,
    debounceMs = 5000,
    parseResponse,
    serializeState,
    afterLoad,
    afterSave,
  } = config

  let saveDebounceTimer: NodeJS.Timeout | null = null

  return (
    set: (partial: Partial<TState> | ((s: TState) => Partial<TState>)) => void,
    get: () => TState
  ) => ({
    isLoading: false as boolean,
    hasLoadedFromServer: false as boolean,

    loadFromServer: async (options?: { force?: boolean }) => {
      const state = get()

      // Skip if already loaded (unless forced)
      if (state.hasLoadedFromServer && !options?.force) return

      return loadingCoordinator.coordinatedLoad(
        coordinatorKey,
        async () => {
          set({ isLoading: true } as Partial<TState>)

          try {
            const response = await fetch(endpoint, {
              ...(credentials ? { credentials: 'include' as RequestCredentials } : {}),
            })

            if (!response.ok) {
              if (response.status === 401 && typeof window !== 'undefined') {
                window.location.href = '/login'
              }
              throw new Error(`Failed to load from ${endpoint}: ${response.status}`)
            }

            const data = await response.json()
            const parsed = parseResponse(data, state)

            set({
              ...parsed,
              isLoading: false,
              hasLoadedFromServer: true,
            } as Partial<TState>)

            afterLoad?.(get, set)

            return data
          } catch (error) {
            console.error(`Error loading from ${endpoint}:`, error)
            set({
              isLoading: false,
              hasLoadedFromServer: true,
            } as Partial<TState>)
            throw error
          }
        },
        { bypassCache: state.isLoading }
      )
    },

    saveToServer: async (options?: { immediate?: boolean }) => {
      const immediate = options?.immediate ?? false
      const state = get()

      if (!state.hasLoadedFromServer || state.isLoading) return

      const performSave = async () => {
        const latestState = get()
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            ...(credentials ? { credentials: 'include' as RequestCredentials } : {}),
            body: JSON.stringify(serializeState(latestState)),
          })

          if (!response.ok) {
            if (response.status === 401 && typeof window !== 'undefined') {
              window.location.href = '/login'
              return
            }
            const errorData = await response.json().catch(() => ({}))
            if (errorData.blocked) return
            throw new Error(`Failed to save to ${endpoint}: ${response.status}`)
          }

          afterSave?.()
        } catch (error) {
          console.error(`Error saving to ${endpoint}:`, error)
        }
      }

      if (immediate) {
        if (saveDebounceTimer) {
          clearTimeout(saveDebounceTimer)
          saveDebounceTimer = null
        }
        await performSave()
        return
      }

      if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
      saveDebounceTimer = setTimeout(performSave, debounceMs)
    },
  })
}
