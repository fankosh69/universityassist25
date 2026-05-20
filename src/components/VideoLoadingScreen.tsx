import { useEffect, useRef } from "react";

interface VideoLoadingScreenProps {
  onComplete?: () => void;
}

const SAFETY_TIMEOUT_MS = 6000;

const VideoLoadingScreen = ({ onComplete }: VideoLoadingScreenProps) => {
  const completedRef = useRef(false);

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  };

  useEffect(() => {
    // Respect reduced motion — skip the intro video entirely.
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      finish();
      return;
    }
    // Safety net: never let the loader hang.
    const t = window.setTimeout(finish, SAFETY_TIMEOUT_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <video
        src="/intro-loader.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        className="h-full w-full object-contain"
      />
    </div>
  );
};

export default VideoLoadingScreen;