import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QABanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if QA mode is active by looking for environment indicators
    // In a real QA environment, this would check process.env.QA_MODE
    // For demo purposes, we'll show it on staging URLs or when explicitly enabled
    const isQAMode = 
      window.location.hostname.includes('lovable.app') ||
      window.location.hostname.includes('staging') ||
      localStorage.getItem('qa_mode') === 'true';

    setIsVisible(isQAMode && !isDismissed);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Remember dismissal for this session
    sessionStorage.setItem('qa_banner_dismissed', 'true');
  };

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('qa_banner_dismissed') === 'true';
    if (wasDismissed) {
      setIsDismissed(true);
    }
  }, []);

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <Alert className="border-none bg-transparent text-white rounded-none">
        <TestTube className="h-4 w-4 text-white" />
        <AlertDescription className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="font-semibold">🧪 QA Testing Environment</span>
            <span className="text-orange-100">•</span>
            <span className="text-sm">
              University Assist - Staging Mode • No real emails sent • Test data only
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-white hover:bg-white/20 p-1 h-auto"
            aria-label="Dismiss QA banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default QABanner;