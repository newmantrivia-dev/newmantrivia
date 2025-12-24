'use client';

import { useAblyConnectionStatus } from '@/lib/ably/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  variant: 'admin' | 'public';
}

export function ConnectionStatus({ variant }: ConnectionStatusProps) {
  const status = useAblyConnectionStatus();
  const router = useRouter();
  
  if (variant === 'admin') {
    return (
      <Badge variant="outline" className="gap-2">
        {status === 'connected' && (
          <>
            <Wifi className="h-3 w-3 text-green-500" />
            <span>Real-time connected</span>
          </>
        )}
        {status === 'connecting' && (
          <>
            <Wifi className="h-3 w-3 text-yellow-500 animate-pulse" />
            <span>Connecting...</span>
          </>
        )}
        {status === 'disconnected' && (
          <>
            <WifiOff className="h-3 w-3 text-red-500" />
            <span>Connection lost</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.refresh()}
              className="h-5 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </>
        )}
      </Badge>
    );
  }
  
  if (status === 'disconnected') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant="destructive" className="gap-2">
          <WifiOff className="h-3 w-3" />
          Disconnected
        </Badge>
      </div>
    );
  }
  
  return null;
}

