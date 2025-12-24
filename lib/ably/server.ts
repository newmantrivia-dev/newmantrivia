import Ably from 'ably';
import type { Rest } from 'ably';
import type { AblyEventPayloads } from './config';
import { getEventChannel } from './config';
import { env } from '@/lib/env';

let ablyServer: Rest | null = null;

export function getAblyServer(): Rest | null {
  if (!ablyServer) {
    try {
      ablyServer = new Ably.Rest({ key: env.ABLY_API_KEY });
    } catch (error) {
      console.error('[Ably] Failed to initialize server client:', error);
      return null;
    }
  }
  
  return ablyServer;
}

export async function publishEvent<T extends keyof AblyEventPayloads>(
  eventId: string,
  eventType: T,
  payload: AblyEventPayloads[T]
): Promise<void> {
  try {
    const ably = getAblyServer();
    if (!ably) return;
    
    const channel = ably.channels.get(getEventChannel(eventId));
    await channel.publish(eventType, payload);
    
    console.log(`[Ably] Published ${eventType} to ${getEventChannel(eventId)}`);
  } catch (error) {
    console.error('[Ably] Publish failed:', error);
  }
}
