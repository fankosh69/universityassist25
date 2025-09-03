import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete?: () => void;
}

const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [arrowAnimated, setArrowAnimated] = useState(false);
  
  const fullText = "Loading… Your way to Germany";

  useEffect(() => {
    // Arrow fly-in animation
    setTimeout(() => setArrowAnimated(true), 300);

    // Progress animation
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setIsComplete(true);
          if (onComplete) {
            setTimeout(() => onComplete(), 800);
          }
          return 100;
        }
        return prev + 2;
      });
    }, 80);

    // Typing animation
    let textIndex = 0;
    const typeTimer = setInterval(() => {
      if (textIndex <= fullText.length) {
        setCurrentText(fullText.slice(0, textIndex));
        textIndex++;
      } else {
        clearInterval(typeTimer);
      }
    }, 100);

    return () => {
      clearInterval(progressTimer);
      clearInterval(typeTimer);
    };
  }, [onComplete, fullText]);

  // Trigger sparkles at 75%
  useEffect(() => {
    if (progress >= 75 && !showSparkles) {
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 1200);
    }
  }, [progress, showSparkles]);

  const circumference = 2 * Math.PI * 26; // radius = 26
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className={`fixed inset-0 bg-background z-50 flex flex-col items-center justify-center transition-all duration-800 ${
        isComplete ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-primary opacity-5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-secondary opacity-5 blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center space-y-8 animate-fade-in">
        
        {/* Logo with animated arrow */}
        <div className="relative flex items-center space-x-6">
          <img 
            src="/lovable-uploads/fda0393f-0b68-4ef6-bd9a-3d02ac39e07b.png" 
            alt="University Assist Logo" 
            className="h-20 w-auto object-contain animate-fade-in delay-200"
          />
          
          {/* Animated Arrow with Progress Ring */}
          <div className="relative">
            {/* Arrow SVG */}
            <svg
              className={`w-12 h-12 relative z-10 transition-all duration-500 ${
                arrowAnimated ? 'translate-x-0 translate-y-0 opacity-100' : '-translate-x-24 translate-y-24 opacity-0'
              } ${
                progress === 25 ? 'animate-pulse scale-125' : 
                progress === 50 ? 'animate-bounce' : ''
              }`}
              style={{
                filter: showSparkles ? 'drop-shadow(0 0 12px hsl(var(--secondary)))' : 'none'
              }}
              viewBox="0 0 48 48"
            >
              <path
                d="M24 8L36 20H28V32H20V20H12L24 8Z"
                fill="hsl(var(--secondary))"
                className="drop-shadow-sm"
              />
            </svg>

            {/* Sparkles for 75% milestone */}
            {showSparkles && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-secondary rounded-full animate-ping"
                    style={{
                      left: `${24 + Math.cos(i * 60 * Math.PI / 180) * 30}px`,
                      top: `${24 + Math.sin(i * 60 * Math.PI / 180) * 30}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s'
                    }}
                  />
                ))}
              </div>
            )}

            {/* Circular Progress Ring */}
            <svg
              className="absolute inset-0 -m-4 w-20 h-20"
              viewBox="0 0 56 56"
            >
              {/* Background circle */}
              <circle
                cx="28"
                cy="28"
                r="26"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="2"
              />
              {/* Progress circle */}
              <circle
                cx="28"
                cy="28"
                r="26"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 ease-out -rotate-90"
                style={{
                  transformOrigin: "50% 50%"
                }}
              />
            </svg>
          </div>
        </div>

        {/* Loading text with typing animation */}
        <div className="text-center animate-fade-in delay-1000">
          <p className="text-lg font-medium text-foreground">
            {currentText}
            <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse" />
          </p>
        </div>

        {/* Progress percentage */}
        <div className="text-sm text-muted-foreground font-mono animate-fade-in delay-1500">
          {progress}%
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;