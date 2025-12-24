'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import { useAblyEvent } from '@/lib/ably/hooks';
import { ABLY_EVENTS } from '@/lib/ably/config';
import { useSession } from '@/lib/auth/client';
import type { AblyEventPayloads } from '@/lib/ably/config';

export interface ConflictState {
  teamId: string;
  roundNumber: number;
  currentValue: string;
  newValue: number;
  changedBy: string;
  changedByName: string;
}

interface RealtimeContextValue {
  highlightedRows: Set<string>;
  conflicts: ConflictState[];
  addHighlight: (teamId: string, roundNumber: number) => void;
  addConflict: (conflict: ConflictState) => void;
  resolveConflict: (teamId: string, roundNumber: number, accept: boolean) => void;
  isEditing: (teamId: string, roundNumber: number) => boolean;
  setEditing: (teamId: string, roundNumber: number, editing: boolean) => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within RealtimeProvider');
  }
  return context;
}

interface RealtimeProviderProps {
  eventId: string;
  children: ReactNode;
}

export function RealtimeProvider({ eventId, children }: RealtimeProviderProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || null;
  const [highlightedRows, setHighlightedRows] = useState<Set<string>>(new Set());
  const [conflicts, setConflicts] = useState<ConflictState[]>([]);
  const editingFieldsRef = useRef<Set<string>>(new Set());
  const highlightTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const isMyChange = useCallback((changedBy: string) => {
    return currentUserId === changedBy;
  }, [currentUserId]);

  const addHighlight = useCallback((teamId: string, roundNumber: number) => {
    const key = `${teamId}-${roundNumber}`;
    
    const existingTimeout = highlightTimeoutsRef.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    setHighlightedRows((prev) => new Set(prev).add(key));

    const timeout = setTimeout(() => {
      setHighlightedRows((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      highlightTimeoutsRef.current.delete(key);
    }, 2500);

    highlightTimeoutsRef.current.set(key, timeout);
  }, []);

  const addConflict = useCallback((conflict: ConflictState) => {
    setConflicts((prev) => {
      const filtered = prev.filter(
        (c) => !(c.teamId === conflict.teamId && c.roundNumber === conflict.roundNumber)
      );
      return [...filtered, conflict];
    });
  }, []);

  const resolveConflict = useCallback((teamId: string, roundNumber: number) => {
    setConflicts((prev) =>
      prev.filter(
        (c) => !(c.teamId === teamId && c.roundNumber === roundNumber)
      )
    );
    
    const key = `${teamId}-${roundNumber}`;
    editingFieldsRef.current.delete(key);
  }, []);

  const isEditing = useCallback((teamId: string, roundNumber: number) => {
    const key = `${teamId}-${roundNumber}`;
    return editingFieldsRef.current.has(key);
  }, []);

  const setEditing = useCallback((teamId: string, roundNumber: number, editing: boolean) => {
    const key = `${teamId}-${roundNumber}`;
    if (editing) {
      editingFieldsRef.current.add(key);
    } else {
      editingFieldsRef.current.delete(key);
    }
  }, []);

  useAblyEvent(eventId, ABLY_EVENTS.SCORE_UPDATED, useCallback((payload: AblyEventPayloads['score:updated']) => {
    if (isMyChange(payload.changedBy)) {
      return;
    }

    const key = `${payload.teamId}-${payload.roundNumber}`;
    
    if (editingFieldsRef.current.has(key)) {
      addConflict({
        teamId: payload.teamId,
        roundNumber: payload.roundNumber,
        currentValue: '',
        newValue: payload.points,
        changedBy: payload.changedBy,
        changedByName: payload.changedByName,
      });
    } else {
      addHighlight(payload.teamId, payload.roundNumber);
    }
  }, [isMyChange, addHighlight, addConflict]));

  const cleanup = useCallback(() => {
    highlightTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    highlightTimeoutsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <RealtimeContext.Provider
      value={{
        highlightedRows,
        conflicts,
        addHighlight,
        addConflict,
        resolveConflict,
        isEditing,
        setEditing,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

