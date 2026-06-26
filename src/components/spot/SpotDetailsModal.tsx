'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Overlay } from '@/components/feedback/Overlay';
import { SpotDetailsContent } from './SpotDetailsContent';
import { useAppState } from '@/components/layout/AppStateProvider';
import type { Spot } from '@/lib/types';

interface SpotDetailsModalProps {
  spot: Spot | null;
  spotTitleId: string;
  onClose: () => void;
}

export function SpotDetailsModal({
  spot,
  spotTitleId,
  onClose,
}: SpotDetailsModalProps) {
  const router = useRouter();
  const { isSaved, toggleSaved } = useAppState();

  const handleClose = () => {
    onClose();
  };

  const handleToggleSave = (id: string) => {
    toggleSaved(id);
  };

  if (!spot) return null;

  return (
    <Overlay
      isOpen={Boolean(spot)}
      onClose={handleClose}
      labelledBy={spotTitleId}
      panelClassName="overflow-hidden rounded-2xl bg-surface text-on-surface shadow-2xl border border-outline-variant max-w-4xl"
    >
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Close spot details"
        className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-all hover:bg-black/75 backdrop-blur-md"
      >
        <X size={20} aria-hidden="true" />
      </button>

      <SpotDetailsContent
        spot={spot}
        isSaved={isSaved(spot.id)}
        onToggleSave={handleToggleSave}
        variant="modal"
      />
    </Overlay>
  );
}
