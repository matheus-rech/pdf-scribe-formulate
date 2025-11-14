import { openDB, IDBPDatabase } from 'idb';

interface ExtractionData {
  id: string;
  studyId: string;
  data: any;
  annotations: any[];
  timestamp: number;
  synced: boolean;
  userId?: string;
}

interface AnnotationData {
  id: string;
  pageNumber: number;
  type: string;
  content: string;
  timestamp: number;
  synced: boolean;
  studyId?: string;
}

interface SyncQueueData {
  id?: number;
  type: 'extraction' | 'annotation';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineStorage {
  private db: IDBPDatabase | null = null;
  private readonly DB_NAME = 'pdf-extraction-db';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Extractions store
        if (!db.objectStoreNames.contains('extractions')) {
          const extractionStore = db.createObjectStore('extractions', { keyPath: 'id' });
          extractionStore.createIndex('by-sync', 'synced');
          extractionStore.createIndex('by-timestamp', 'timestamp');
        }

        // Annotations store
        if (!db.objectStoreNames.contains('annotations')) {
          const annotationStore = db.createObjectStore('annotations', { keyPath: 'id' });
          annotationStore.createIndex('by-sync', 'synced');
          annotationStore.createIndex('by-study', 'studyId');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }

  // Extraction operations
  async saveExtraction(extraction: {
    id: string;
    studyId: string;
    data: any;
    annotations?: any[];
    userId?: string;
  }): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('extractions', {
      ...extraction,
      annotations: extraction.annotations || [],
      timestamp: Date.now(),
      synced: false,
    });

    // Add to sync queue
    await this.addToSyncQueue('extraction', 'create', extraction);
  }

  async getExtraction(id: string): Promise<any> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get('extractions', id);
  }

  async getAllExtractions(): Promise<any[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('extractions');
  }

  async getUnsyncedExtractions(): Promise<any[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllFromIndex('extractions', 'by-sync', IDBKeyRange.only(false));
  }

  async markExtractionSynced(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const extraction = await this.db.get('extractions', id);
    if (extraction) {
      extraction.synced = true;
      await this.db.put('extractions', extraction);
    }
  }

  // Annotation operations
  async saveAnnotation(annotation: {
    id: string;
    pageNumber: number;
    type: string;
    content: string;
    studyId?: string;
  }): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('annotations', {
      ...annotation,
      timestamp: Date.now(),
      synced: false,
    });

    // Add to sync queue
    await this.addToSyncQueue('annotation', 'create', annotation);
  }

  async getAnnotationsByStudy(studyId: string): Promise<any[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllFromIndex('annotations', 'by-study', studyId);
  }

  async getUnsyncedAnnotations(): Promise<any[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllFromIndex('annotations', 'by-sync', IDBKeyRange.only(false));
  }

  async markAnnotationSynced(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const annotation = await this.db.get('annotations', id);
    if (annotation) {
      annotation.synced = true;
      await this.db.put('annotations', annotation);
    }
  }

  // Sync queue operations
  async addToSyncQueue(
    type: 'extraction' | 'annotation',
    action: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.add('syncQueue', {
      type,
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
    } as any);
  }

  async getSyncQueue(): Promise<any[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('syncQueue');
  }

  async removeSyncQueueItem(id: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('syncQueue', id);
  }

  async incrementSyncRetry(id: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const item = await this.db.get('syncQueue', id);
    if (item) {
      item.retries += 1;
      await this.db.put('syncQueue', item);
    }
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.clear('extractions');
    await this.db.clear('annotations');
    await this.db.clear('syncQueue');
  }

  // Get storage stats
  async getStorageStats(): Promise<{
    extractions: number;
    annotations: number;
    pendingSync: number;
  }> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const [extractions, annotations, syncQueue] = await Promise.all([
      this.db.count('extractions'),
      this.db.count('annotations'),
      this.db.count('syncQueue'),
    ]);

    return {
      extractions,
      annotations,
      pendingSync: syncQueue,
    };
  }
}

export const offlineStorage = new OfflineStorage();
