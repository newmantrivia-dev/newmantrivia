export const ABLY_EVENTS = {
  SCORE_UPDATED: 'score:updated',
  SCORE_DELETED: 'score:deleted',
  ROUND_CHANGED: 'round:changed',
  TEAM_ADDED: 'team:added',
  TEAM_REMOVED: 'team:removed',
  EVENT_STATUS_CHANGED: 'event:status',
} as const;

export type AblyEventPayloads = {
  'score:updated': {
    teamId: string;
    teamName: string;
    roundNumber: number;
    points: number;
    oldPoints?: number;
    changedBy: string;
    changedByName: string;
    timestamp: string;
  };
  
  'score:deleted': {
    teamId: string;
    teamName: string;
    roundNumber: number;
    changedBy: string;
    changedByName: string;
    timestamp: string;
  };
  
  'round:changed': {
    newRound: number;
    totalRounds: number;
    changedBy: string;
    changedByName: string;
    timestamp: string;
  };
  
  'team:added': {
    teamId: string;
    teamName: string;
    joinedRound: number;
    timestamp: string;
  };
  
  'team:removed': {
    teamId: string;
    teamName: string;
    timestamp: string;
  };
  
  'event:status': {
    status: 'active' | 'completed' | 'archived';
    timestamp: string;
  };
};

export function getEventChannel(eventId: string): string {
  return `event:${eventId}`;
}

export function isValidEventId(eventId: string): boolean {
  return typeof eventId === 'string' && eventId.length > 0;
}

