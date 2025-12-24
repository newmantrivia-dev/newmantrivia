'use client';

import { useEffect, useState, useRef } from 'react';
import { getAblyClientAsync } from './client';
import { type AblyEventPayloads } from './config';
import { getEventChannel } from './config';
import type { RealtimeChannel, InboundMessage } from 'ably';

export function useAblyChannel(eventId: string | null) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  useEffect(() => {
    if (!eventId) {
      setChannel(null);
      return;
    }
    
    let mounted = true;
    let ch: RealtimeChannel | null = null;
    
    (async () => {
      const ably = await getAblyClientAsync();
      if (!ably || !mounted) {
        if (mounted) setChannel(null);
        return;
      }
      
      ch = ably.channels.get(getEventChannel(eventId));
      if (mounted) setChannel(ch);
    })();
    
    return () => {
      mounted = false;
      if (ch) {
        ch.unsubscribe();
        ch.detach();
      }
      setChannel(null);
    };
  }, [eventId]);
  
  return channel;
}

export function useAblyEvent<T extends keyof AblyEventPayloads>(
  eventId: string | null,
  eventType: T,
  callback: (payload: AblyEventPayloads[T]) => void
) {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (!eventId) return;
    
    let mounted = true;
    let channel: RealtimeChannel | null = null;
    let subscribed = false;
    let handler: ((message: InboundMessage) => void) | null = null;
    
    (async () => {
      const ably = await getAblyClientAsync();
      if (!ably || !mounted) return;
      
      channel = ably.channels.get(getEventChannel(eventId));
      
      handler = (message: InboundMessage) => {
        if (!mounted) return;
        if (message.name === eventType) {
          callbackRef.current(message.data as AblyEventPayloads[T]);
        }
      };
      
      channel.subscribe(eventType, handler);
      subscribed = true;
    })();
    
    return () => {
      mounted = false;
      if (channel && subscribed && handler) {
        channel.unsubscribe(eventType, handler);
      }
    };
  }, [eventId, eventType]);
}

export function useAblyConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  useEffect(() => {
    let mounted = true;
    let ably: Awaited<ReturnType<typeof getAblyClientAsync>> = null;
    let updateStatusHandler: (() => void) | null = null;
    
    (async () => {
      ably = await getAblyClientAsync();
      if (!ably || !mounted) {
        if (mounted) setStatus('disconnected');
        return;
      }
      
      updateStatusHandler = () => {
        if (!mounted) return;
        const state = ably!.connection.state;
        if (state === 'connected') {
          setStatus('connected');
        } else if (state === 'connecting' || state === 'initialized') {
          setStatus('connecting');
        } else {
          setStatus('disconnected');
        }
      };
      
      updateStatusHandler();
      ably.connection.on(updateStatusHandler);
    })();
    
    return () => {
      mounted = false;
      if (ably && updateStatusHandler) {
        ably.connection.off(updateStatusHandler);
      }
    };
  }, []);
  
  return status;
}

