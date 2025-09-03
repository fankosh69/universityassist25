import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete?: () => void;
}

const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'logo' | 'arrow' | 'tagline' | 'complete'>('logo');
  const [visibleLetters, setVisibleLetters] = useState(0);
  const [arrowVisible, setArrowVisible] = useState(false);
  const [taglineVisible, setTaglineVisible] = useState(false);
  const [currentTaglineText, setCurrentTaglineText] = useState("");
  const [showSparkles, setShowSparkles] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const logoText = "University Assist";
  const taglineText = "Your Way to Germany";

  useEffect(() => {
    // Phase 1: Letter-by-letter logo animation
    if (phase === 'logo') {
      const letterTimer = setInterval(() => {
        setVisibleLetters(prev => {
          if (prev >= logoText.length) {
            clearInterval(letterTimer);
            setTimeout(() => setPhase('arrow'), 500);
            return logoText.length;
          }
          return prev + 1;
        });
      }, 120);

      return () => clearInterval(letterTimer);
    }

    // Phase 2: Arrow animation with progress
    if (phase === 'arrow') {
      setArrowVisible(true);
      
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 75) {
            if (!showSparkles) {
              setShowSparkles(true);
              setTimeout(() => setShowSparkles(false), 1200);
            }
          }
          
          if (prev >= 100) {
            clearInterval(progressTimer);
            setTimeout(() => setPhase('tagline'), 600);
            return 100;
          }
          return prev + 3;
        });
      }, 50);

      return () => clearInterval(progressTimer);
    }

    // Phase 3: Tagline typing animation
    if (phase === 'tagline') {
      setTaglineVisible(true);
      let textIndex = 0;
      
      const typeTimer = setInterval(() => {
        if (textIndex <= taglineText.length) {
          setCurrentTaglineText(taglineText.slice(0, textIndex));
          textIndex++;
        } else {
          clearInterval(typeTimer);
          setTimeout(() => setPhase('complete'), 800);
        }
      }, 80);

      return () => clearInterval(typeTimer);
    }

    // Phase 4: Complete and exit
    if (phase === 'complete') {
      setIsComplete(true);
      if (onComplete) {
        setTimeout(() => onComplete(), 1200);
      }
    }
  }, [phase, onComplete, logoText.length, taglineText, showSparkles]);

  const circumference = 2 * Math.PI * 26;
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
      <div className="flex flex-col items-center space-y-8">
        
        {/* Logo Text Animation */}
        <div className="text-center">
          <div className="text-4xl md:text-5xl font-bold font-heading mb-6">
            {logoText.split('').map((letter, index) => (
              <span
                key={index}
                className={`inline-block transition-all duration-300 ${
                  index < visibleLetters 
                    ? 'opacity-100 translate-y-0 scale-100 animate-letter-reveal' 
                    : 'opacity-0 translate-y-5 scale-75'
                } ${
                  index < 10 ? 'text-primary' : 'text-secondary'
                }`}
                style={{
                  animationDelay: `${index * 120}ms`,
                  textShadow: phase === 'complete' ? '0 0 15px hsl(var(--primary) / 0.4)' : 'none'
                }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow with Progress Ring */}
        {arrowVisible && (
          <div 
            className={`relative transition-all duration-700 ${
              arrowVisible ? 'opacity-100 animate-fly-in' : 'opacity-0'
            }`}
          >
            {/* Arrow SVG */}
            <svg
              className={`w-16 h-16 relative z-10 transition-all duration-300 ${
                progress >= 25 && progress < 35 ? 'animate-pulse scale-125' : 
                progress >= 50 && progress < 60 ? 'animate-bounce' : ''
              }`}
              style={{
                filter: showSparkles ? 'drop-shadow(0 0 15px hsl(var(--secondary)))' : 'none'
              }}
              viewBox="0 0 48 48"
            >
              <path
                d="M24 8L36 20H28V32H20V20H12L24 8Z"
                fill="hsl(var(--secondary))"
                className="drop-shadow-lg"
              />
            </svg>

            {/* Sparkles for 75% milestone */}
            {showSparkles && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-secondary rounded-full animate-sparkle"
                    style={{
                      left: `${32 + Math.cos(i * 45 * Math.PI / 180) * 40}px`,
                      top: `${32 + Math.sin(i * 45 * Math.PI / 180) * 40}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Circular Progress Ring */}
            <svg
              className="absolute inset-0 -m-6 w-28 h-28"
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
        )}

        {/* Tagline Animation */}
        {taglineVisible && (
          <div 
            className={`text-center transition-all duration-500 ${
              taglineVisible ? 'opacity-100 animate-slide-up-fade' : 'opacity-0'
            }`}
          >
            <p className="text-xl md:text-2xl font-medium text-foreground animate-glow-pulse">
              {currentTaglineText}
              <span className="inline-block w-0.5 h-6 bg-accent ml-1 animate-pulse" />
            </p>
          </div>
        )}

        {/* Progress percentage */}
        {arrowVisible && (
          <div 
            className={`text-sm text-muted-foreground font-mono transition-all duration-300 ${
              progress > 0 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {Math.round(progress)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;