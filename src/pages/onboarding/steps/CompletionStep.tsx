import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trophy, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function CompletionStep() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(redirectTo, { replace: true });
    }, 6000);
    return () => clearTimeout(timer);
  }, [navigate, redirectTo]);

  return (
    <div className="text-center space-y-8 py-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/20"
      >
        <CheckCircle2 className="w-12 h-12 text-accent" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-3xl font-bold">You're All Set! 🎉</h1>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          Your profile is complete. We can now match you with the best programs in Germany.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center gap-6"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border">
          <Star className="w-5 h-5 text-primary" />
          <div className="text-left">
            <p className="text-sm font-semibold text-primary">+50 XP</p>
            <p className="text-xs text-muted-foreground">Profile completed</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border">
          <Trophy className="w-5 h-5 text-accent" />
          <div className="text-left">
            <p className="text-sm font-semibold text-accent">Profile Pioneer</p>
            <p className="text-xs text-muted-foreground">Badge earned</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Button
          size="lg"
          onClick={() => navigate(redirectTo, { replace: true })}
          className="gap-2 px-8"
        >
          {redirectTo !== '/dashboard' ? 'Continue to Program' : 'Go to Dashboard'}
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-3 animate-pulse">
          Redirecting in a few seconds...
        </p>
      </motion.div>
    </div>
  );
}
