import { useEffect, useState, useCallback } from 'react';
import { offlineStorage } from '@/lib/offlineStorage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState({
    extractions: 0,
    annotations: 0,
    pendingSync: 0,
  });
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back online',
        description: 'Syncing your data...',
      });
      syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You are offline',
        description: 'Your work will be saved locally and synced when you reconnect.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load storage stats
  const loadStats = useCallback(async () => {
    try {
      const stats = await offlineStorage.getStorageStats();
      setSyncStats(stats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  }, []);

  useEffect(() => {
    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  // Sync data with Supabase
  const syncData = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, skipping sync');
        return;
      }

      // Get sync queue
      const syncQueue = await offlineStorage.getSyncQueue();
      console.log(`Syncing ${syncQueue.length} items...`);

      let successCount = 0;
      let failCount = 0;

      for (const item of syncQueue) {
        try {
          if (item.type === 'extraction') {
            // Sync extraction data
            const { error } = await supabase
              .from('study_extractions' as any)
              .upsert({
                id: item.data.id,
                study_id: item.data.studyId,
                data: item.data.data,
                annotations: item.data.annotations || [],
                user_id: user.id,
                updated_at: new Date().toISOString(),
              } as any);

            if (error) throw error;
            await offlineStorage.markExtractionSynced(item.data.id);
          } else if (item.type === 'annotation') {
            // Sync annotation data
            const { error } = await supabase
              .from('pdf_annotations' as any)
              .upsert({
                id: item.data.id,
                page_number: item.data.pageNumber,
                type: item.data.type,
                content: item.data.content,
                study_id: item.data.studyId || null,
                user_id: user.id,
                updated_at: new Date().toISOString(),
              } as any);

            if (error) throw error;
            await offlineStorage.markAnnotationSynced(item.data.id);
          }

          // Remove from sync queue
          await offlineStorage.removeSyncQueueItem(item.id);
          successCount++;
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error);
          
          // Increment retry count
          await offlineStorage.incrementSyncRetry(item.id);
          failCount++;

          // Remove from queue after 5 failed attempts
          if (item.retries >= 5) {
            await offlineStorage.removeSyncQueueItem(item.id);
            console.log(`Removed item ${item.id} after 5 failed attempts`);
          }
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Sync complete',
          description: `Successfully synced ${successCount} item(s)`,
        });
      }

      if (failCount > 0) {
        toast({
          title: 'Partial sync',
          description: `${failCount} item(s) failed to sync and will be retried`,
          variant: 'destructive',
        });
      }

      // Refresh stats
      await loadStats();
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync failed',
        description: 'Unable to sync your data. Will retry automatically.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, toast, loadStats]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && syncStats.pendingSync > 0) {
      const timer = setTimeout(() => {
        syncData();
      }, 2000); // Delay sync by 2 seconds after coming online

      return () => clearTimeout(timer);
    }
  }, [isOnline, syncStats.pendingSync, syncData]);

  // Save extraction offline
  const saveExtractionOffline = useCallback(async (extraction: any) => {
    try {
      await offlineStorage.saveExtraction(extraction);
      await loadStats();
      
      if (isOnline) {
        // Trigger sync if online
        syncData();
      } else {
        toast({
          title: 'Saved offline',
          description: 'Your work will be synced when you reconnect.',
        });
      }
    } catch (error) {
      console.error('Error saving extraction offline:', error);
      toast({
        title: 'Save failed',
        description: 'Unable to save data locally',
        variant: 'destructive',
      });
    }
  }, [isOnline, syncData, toast, loadStats]);

  // Save annotation offline
  const saveAnnotationOffline = useCallback(async (annotation: any) => {
    try {
      await offlineStorage.saveAnnotation(annotation);
      await loadStats();
      
      if (isOnline) {
        // Trigger sync if online
        syncData();
      }
    } catch (error) {
      console.error('Error saving annotation offline:', error);
      toast({
        title: 'Save failed',
        description: 'Unable to save annotation locally',
        variant: 'destructive',
      });
    }
  }, [isOnline, syncData, toast, loadStats]);

  // Manual sync trigger
  const forceSyncData = useCallback(() => {
    if (!isOnline) {
      toast({
        title: 'Cannot sync',
        description: 'You are currently offline',
        variant: 'destructive',
      });
      return;
    }
    syncData();
  }, [isOnline, syncData, toast]);

  return {
    isOnline,
    isSyncing,
    syncStats,
    saveExtractionOffline,
    saveAnnotationOffline,
    syncData: forceSyncData,
    loadStats,
  };
};
