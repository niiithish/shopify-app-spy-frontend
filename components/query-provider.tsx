"use client"

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import type { Persister, PersistedClient } from "@tanstack/query-persist-client-core"
import { getQueryClient } from "@/lib/query-client"
import { ReactNode } from "react"

interface QueryProviderProps {
  children: ReactNode
}

// Create a localStorage persister
function createLocalStoragePersister(): Persister {
  const PERSIST_KEY = "SHOPIFY_APP_SPY_QUERY_CACHE"

  return {
    persistClient: async (persistedClient: PersistedClient) => {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify(persistedClient))
      } catch (error) {
        // Handle quota exceeded or other errors
        console.warn("Failed to persist query cache:", error)
      }
    },
    restoreClient: async () => {
      try {
        const stored = localStorage.getItem(PERSIST_KEY)
        if (stored) {
          return JSON.parse(stored) as PersistedClient
        }
      } catch (error) {
        console.warn("Failed to restore query cache:", error)
      }
      return undefined
    },
    removeClient: async () => {
      try {
        localStorage.removeItem(PERSIST_KEY)
      } catch (error) {
        console.warn("Failed to remove query cache:", error)
      }
    },
  }
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient()
  const persister = createLocalStoragePersister()

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        // Keep persisted data for 24 hours (garbage collection)
        maxAge: 24 * 60 * 60 * 1000,
        // Only persist successful queries
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            return query.state.status === "success" && query.state.data !== undefined
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}