import type { Realtime } from 'ably';

let ablyClient: Realtime | null = null;
let initPromise: Promise<Realtime | null> | null = null;

function generateClientId(): string {
  return `client-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
}

async function initAblyClient(): Promise<Realtime | null> {
  if (typeof window === 'undefined') return null;
  
  if (ablyClient) return ablyClient;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      const { default: Ably } = await import('ably');
      
      const apiKey = process.env.NEXT_PUBLIC_ABLY_KEY;
      if (!apiKey) {
        console.warn('[Ably] Client API key not found - real-time features disabled');
        return null;
      }
      
      ablyClient = new Ably.Realtime({
        key: apiKey,
        clientId: generateClientId(),
      });
      
      return ablyClient;
    } catch (error) {
      console.error('[Ably] Failed to initialize client:', error);
      return null;
    } finally {
      initPromise = null;
    }
  })();
  
  return initPromise;
}

export async function getAblyClientAsync(): Promise<Realtime | null> {
  if (typeof window === 'undefined') return null;
  return initAblyClient();
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (ablyClient) {
      ablyClient.close();
      ablyClient = null;
    }
  });
}

