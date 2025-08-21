import { GraduationCap } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

const LoadingSpinner = ({ size = "md", message = "Loading..." }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12", 
    lg: "h-16 w-16"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        <GraduationCap className={`${sizeClasses[size]} text-primary animate-pulse`} />
        <div className={`absolute inset-0 ${sizeClasses[size]} border-2 border-primary/30 border-t-primary rounded-full animate-spin`}></div>
      </div>
      {message && (
        <p className="mt-4 text-muted-foreground text-center">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;