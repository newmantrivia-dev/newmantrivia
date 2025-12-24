import Ably from 'ably';
import type { Rest } from 'ably';
import type { AblyEventPayloads } from './config';
import { getEventChannel } from './config';

let ablyServer: Rest | null = null;

export function getAblyServer(): Rest | null {
  if (!ablyServer) {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) {
      console.warn('[Ably] Server API key not found - real-time features disabled');
      return null;
    }
    
    try {
      ablyServer = new Ably.Rest({ key: apiKey });
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
