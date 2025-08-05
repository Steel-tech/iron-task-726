/**
 * Sync Service
 * Handles synchronization of offline media to the server
 */

import { api } from './api'
import { offlineStorage, type OfflineMedia } from './offline-storage'

interface SyncProgress {
  totalItems: number
  completedItems: number
  currentItem?: string
  errors: Array<{ id: string; error: string }>
}

type SyncProgressCallback = (progress: SyncProgress) => void

class SyncService {
  private isSyncing = false
  private syncQueue: OfflineMedia[] = []
  private maxRetries = 3
  private retryDelay = 1000 // Base delay in ms, will increase exponentially

  async startSync(onProgress?: SyncProgressCallback): Promise<SyncProgress> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress')
    }

    if (!offlineStorage.isOnline()) {
      throw new Error('No internet connection available')
    }

    this.isSyncing = true
    
    try {
      // Get all pending media
      const pendingMedia = await offlineStorage.getOfflineMedia({ syncStatus: 'pending' })
      const errorMedia = await offlineStorage.getOfflineMedia({ syncStatus: 'error' })
      
      // Include error media that haven't exceeded retry limit
      const retryableMedia = errorMedia.filter(media => media.retryCount < this.maxRetries)
      
      this.syncQueue = [...pendingMedia, ...retryableMedia]
      
      const progress: SyncProgress = {
        totalItems: this.syncQueue.length,
        completedItems: 0,
        errors: []
      }

      if (onProgress) onProgress(progress)

      // Process each media item
      for (const media of this.syncQueue) {
        if (!offlineStorage.isOnline()) {
          throw new Error('Connection lost during sync')
        }

        progress.currentItem = media.file.name

        try {
          await offlineStorage.updateMediaSyncStatus(media.id, 'syncing')
          await this.syncSingleMedia(media)
          await offlineStorage.updateMediaSyncStatus(media.id, 'synced')
          
          progress.completedItems++
        } catch (error) {
          const newRetryCount = media.retryCount + 1
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          if (newRetryCount >= this.maxRetries) {
            // Mark as permanently failed
            await offlineStorage.updateMediaSyncStatus(media.id, 'error', newRetryCount)
            progress.errors.push({ id: media.id, error: errorMessage })
          } else {
            // Mark for retry
            await offlineStorage.updateMediaSyncStatus(media.id, 'error', newRetryCount)
            
            // Wait before next item (exponential backoff)
            await this.delay(this.retryDelay * Math.pow(2, newRetryCount - 1))
          }
        }

        if (onProgress) onProgress(progress)
      }

      // Clean up successfully synced media after a delay
      setTimeout(() => {
        offlineStorage.clearSyncedMedia().catch(() => {
          // Silent cleanup failure
        })
      }, 5000)

      return progress
    } finally {
      this.isSyncing = false
      this.syncQueue = []
    }
  }

  private async syncSingleMedia(media: OfflineMedia): Promise<void> {
    const formData = new FormData()
    formData.append('file', media.file)
    formData.append('projectId', media.projectId)
    formData.append('activityType', media.activityType)
    formData.append('location', media.location)
    formData.append('notes', media.notes)
    formData.append('tags', media.tags)
    formData.append('mediaType', media.mediaType)

    // Add GPS coordinates if available
    if (media.gpsCoordinates) {
      formData.append('latitude', media.gpsCoordinates.latitude.toString())
      formData.append('longitude', media.gpsCoordinates.longitude.toString())
    }

    // Add offline timestamp for server-side handling
    formData.append('offlineTimestamp', media.timestamp.toString())

    await api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 60 second timeout for large files
    })
  }

  async getQueuedItemsCount(): Promise<number> {
    const pending = await offlineStorage.getOfflineMedia({ syncStatus: 'pending' })
    const errors = await offlineStorage.getOfflineMedia({ syncStatus: 'error' })
    const retryableErrors = errors.filter(media => media.retryCount < this.maxRetries)
    
    return pending.length + retryableErrors.length
  }

  async cancelSync(): Promise<void> {
    if (!this.isSyncing) return
    
    // Note: This is a simple cancellation. In a production app,
    // you might want to wait for the current upload to complete
    this.isSyncing = false
    this.syncQueue = []
  }

  isSyncInProgress(): boolean {
    return this.isSyncing
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Auto-sync when connection is restored
  setupAutoSync(onProgress?: SyncProgressCallback): void {
    window.addEventListener('online', async () => {
      // Wait a bit for connection to stabilize
      await this.delay(2000)
      
      try {
        const queuedCount = await this.getQueuedItemsCount()
        
        if (queuedCount > 0) {
          await this.startSync(onProgress)
        }
      } catch (error) {
        // Silent auto-sync failure
      }
    })
  }

  // Background sync for failed items
  async retryFailedSync(): Promise<SyncProgress> {
    const errorMedia = await offlineStorage.getOfflineMedia({ syncStatus: 'error' })
    const retryableMedia = errorMedia.filter(media => media.retryCount < this.maxRetries)

    if (retryableMedia.length === 0) {
      return {
        totalItems: 0,
        completedItems: 0,
        errors: []
      }
    }

    // Reset status to pending for retry
    for (const media of retryableMedia) {
      await offlineStorage.updateMediaSyncStatus(media.id, 'pending', media.retryCount)
    }

    return this.startSync()
  }
}

export const syncService = new SyncService()
export type { SyncProgress, SyncProgressCallback }