import { idbStorage, SyncQueueItem } from '../storage/db';

export const syncQueue = {
  async enqueue(
    entity: SyncQueueItem['entity'],
    entityId: string,
    operation: SyncQueueItem['operation'],
    payload: any
  ): Promise<void> {
    const item: Omit<SyncQueueItem, 'id'> = {
      entity,
      entityId,
      operation,
      payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 0,
    };

    try {
      await idbStorage.addToSyncQueue(item);
    } catch (e) {
      console.error('Failed to enqueue sync item:', e);
    }
  },

  async getPendingItems(): Promise<SyncQueueItem[]> {
    return idbStorage.getSyncQueue();
  },

  async removeItem(id: number): Promise<void> {
    return idbStorage.removeSyncQueueItem(id);
  },

  async clear(): Promise<void> {
    return idbStorage.clearSyncQueue();
  },
};
