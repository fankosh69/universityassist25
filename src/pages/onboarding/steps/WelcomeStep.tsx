import { Button } from "@/components/ui/button";
import { User, GraduationCap, Languages, Target, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface WelcomeStepProps {
  data: Record<string, any>;
  onStart: () => void;
}

const STEPS_OVERVIEW = [
  { icon: User, label: "Basic Information", description: "Name, nationality & contact" },
  { icon: GraduationCap, label: "Academic Background", description: "School, curriculum & GPA" },
  { icon: Languages, label: "Language Skills", description: "Certificates & proficiency" },
  { icon: Target, label: "Study Preferences", description: "Fields, cities & goals" },
];

export function WelcomeStep({ data, onStart }: WelcomeStepProps) {
  const firstName = data.fullName?.split(' ')[0] || '';

  return (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">
          {firstName ? `Welcome, ${firstName}!` : 'Welcome to University Assist!'}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Let's set up your profile in just a few steps. This helps us find the best German university programs for you.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
        {STEPS_OVERVIEW.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
            className="flex items-start gap-3 p-3 rounded-xl border bg-card text-left"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <step.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Button size="lg" onClick={onStart} className="gap-2 px-8">
          Let's Get Started
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Takes about 3–5 minutes • You can always update later
        </p>
      </motion.div>
    </div>
  );
}
