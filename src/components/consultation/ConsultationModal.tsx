import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ConsultationForm } from './ConsultationForm';
import { useNavigate } from 'react-router-dom';

interface ConsultationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  programName: string;
  universityName: string;
}

export function ConsultationModal({
  open,
  onOpenChange,
  programId,
  programName,
  universityName,
}: ConsultationModalProps) {
  const navigate = useNavigate();

  const handleSuccess = () => {
    onOpenChange(false);
    navigate(`/ai-assistant?program_id=${programId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Start Your Application Journey</DialogTitle>
          <DialogDescription>
            Get personalized guidance for {programName} at {universityName}
          </DialogDescription>
        </DialogHeader>
        
        <ConsultationForm
          programId={programId}
          programName={programName}
          universityName={universityName}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}