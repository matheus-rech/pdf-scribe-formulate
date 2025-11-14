import { Wifi, WifiOff, RefreshCw, Database, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Progress } from '@/components/ui/progress';

export const OfflineStatusIndicator = () => {
  const { isOnline, isSyncing, syncStats, syncData } = useOfflineSync();

  const hasPendingSync = syncStats.pendingSync > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
        >
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          {hasPendingSync && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {syncStats.pendingSync}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Connection Status</h4>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {isSyncing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Syncing data...</span>
              </div>
              <Progress value={undefined} className="h-1" />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Local Extractions</span>
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3" />
                <span className="font-medium">{syncStats.extractions}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Local Annotations</span>
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3" />
                <span className="font-medium">{syncStats.annotations}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending Sync</span>
              <div className="flex items-center gap-2">
                {hasPendingSync ? (
                  <>
                    <RefreshCw className="h-3 w-3 text-orange-500" />
                    <span className="font-medium text-orange-500">
                      {syncStats.pendingSync}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="font-medium text-green-500">0</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {isOnline && hasPendingSync && (
            <Button
              onClick={syncData}
              disabled={isSyncing}
              size="sm"
              className="w-full"
            >
              <RefreshCw className={`h-3 w-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          )}

          {!isOnline && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Your work is being saved locally and will sync automatically when
              you're back online.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
