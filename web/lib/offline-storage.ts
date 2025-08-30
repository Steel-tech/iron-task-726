/**
 * Offline Storage Service
 * Handles offline photo/video storage and sync when connection is restored
 */

interface OfflineMedia {
  id: string
  file: File
  projectId: string
  activityType: string
  location: string
  notes: string
  tags: string
  mediaType: 'PHOTO' | 'VIDEO'
  timestamp: number
  gpsCoordinates?: { latitude: number; longitude: number }
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error'
  retryCount: number
  lastSyncAttempt?: number
}

interface OfflineProject {
  id: string
  name: string
  lastSync: number
}

class OfflineStorageService {
  private dbName = 'fsw-offline-storage'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store for offline media files
        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'id' })
          mediaStore.createIndex('syncStatus', 'syncStatus', { unique: false })
          mediaStore.createIndex('timestamp', 'timestamp', { unique: false })
          mediaStore.createIndex('projectId', 'projectId', { unique: false })
        }

        // Store for project metadata
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' })
        }

        // Store for app settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      }
    })
  }

  async saveOfflineMedia(
    media: Omit<OfflineMedia, 'id' | 'timestamp' | 'syncStatus' | 'retryCount'>
  ): Promise<string> {
    if (!this.db) await this.initDB()

    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const offlineMedia: OfflineMedia = {
      ...media,
      id,
      timestamp: Date.now(),
      syncStatus: 'pending',
      retryCount: 0,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['media'], 'readwrite')
      const store = transaction.objectStore('media')
      const request = store.add(offlineMedia)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(id)
    })
  }

  async getOfflineMedia(options?: {
    syncStatus?: OfflineMedia['syncStatus']
    projectId?: string
  }): Promise<OfflineMedia[]> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['media'], 'readonly')
      const store = transaction.objectStore('media')

      let request: IDBRequest

      if (options?.syncStatus) {
        const index = store.index('syncStatus')
        request = index.getAll(options.syncStatus)
      } else if (options?.projectId) {
        const index = store.index('projectId')
        request = index.getAll(options.projectId)
      } else {
        request = store.getAll()
      }

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async updateMediaSyncStatus(
    id: string,
    status: OfflineMedia['syncStatus'],
    retryCount?: number
  ): Promise<void> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['media'], 'readwrite')
      const store = transaction.objectStore('media')
      const getRequest = store.get(id)

      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const media = getRequest.result
        if (media) {
          media.syncStatus = status
          media.lastSyncAttempt = Date.now()
          if (retryCount !== undefined) {
            media.retryCount = retryCount
          }

          const updateRequest = store.put(media)
          updateRequest.onerror = () => reject(updateRequest.error)
          updateRequest.onsuccess = () => resolve()
        } else {
          reject(new Error('Media not found'))
        }
      }
    })
  }

  async deleteOfflineMedia(id: string): Promise<void> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['media'], 'readwrite')
      const store = transaction.objectStore('media')
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getOfflineMediaCount(): Promise<number> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['media'], 'readonly')
      const store = transaction.objectStore('media')
      const request = store.count()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async saveProject(project: OfflineProject): Promise<void> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite')
      const store = transaction.objectStore('projects')
      const request = store.put(project)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getProjects(): Promise<OfflineProject[]> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly')
      const store = transaction.objectStore('projects')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async clearSyncedMedia(): Promise<void> {
    if (!this.db) await this.initDB()

    const syncedMedia = await this.getOfflineMedia({ syncStatus: 'synced' })

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['media'], 'readwrite')
      const store = transaction.objectStore('media')

      let completed = 0
      const total = syncedMedia.length

      if (total === 0) {
        resolve()
        return
      }

      syncedMedia.forEach(media => {
        const request = store.delete(media.id)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          completed++
          if (completed === total) {
            resolve()
          }
        }
      })
    })
  }

  async getCurrentLocation(): Promise<{
    latitude: number
    longitude: number
  } | null> {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        error => {
          console.warn('GPS location not available:', error)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      )
    })
  }

  // Network status helpers
  isOnline(): boolean {
    return navigator.onLine
  }

  async waitForConnection(): Promise<void> {
    return new Promise(resolve => {
      if (this.isOnline()) {
        resolve()
        return
      }

      const handler = () => {
        window.removeEventListener('online', handler)
        resolve()
      }

      window.addEventListener('online', handler)
    })
  }
}

export const offlineStorage = new OfflineStorageService()
export type { OfflineMedia, OfflineProject }
