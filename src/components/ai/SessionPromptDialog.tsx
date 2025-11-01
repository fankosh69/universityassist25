import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface SessionPromptDialogProps {
  open: boolean;
  lastSessionDate: string;
  messageCount: number;
  onContinue: () => void;
  onStartNew: () => void;
}

export function SessionPromptDialog({
  open,
  lastSessionDate,
  messageCount,
  onContinue,
  onStartNew
}: SessionPromptDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Welcome Back!
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p>
              You have an active conversation from{" "}
              <span className="font-medium text-foreground">
                {format(new Date(lastSessionDate), 'MMMM d, yyyy')}
              </span>{" "}
              with {messageCount} messages.
            </p>
            <p>Would you like to continue where you left off or start a new session?</p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={onStartNew}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            Start New Session
          </Button>
          <Button
            onClick={onContinue}
            className="w-full sm:w-auto"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Continue Previous Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}