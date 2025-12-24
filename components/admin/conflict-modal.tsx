'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ConflictState } from './realtime-context';

interface ConflictModalProps {
  conflict: ConflictState | null;
  onResolve: (accept: boolean) => void;
}

export function ConflictModal({ conflict, onResolve }: ConflictModalProps) {
  if (!conflict) return null;

  return (
    <AlertDialog open={!!conflict} onOpenChange={() => onResolve(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Conflict Detected</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              <strong>{conflict.changedByName}</strong> just updated this score while you were editing it.
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">New value:</span> <strong>{conflict.newValue} pts</strong>
              </p>
              <p>
                <span className="font-medium">Your value:</span> <strong>{conflict.currentValue || '—'} pts</strong>
              </p>
            </div>
            <p className="pt-2">
              Would you like to override with your changes, or accept the new value?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onResolve(false)}>
            Accept New Value
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => onResolve(true)}>
            Override with My Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

