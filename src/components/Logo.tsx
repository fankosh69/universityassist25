import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "default" | "white" | "dark";
}

const Logo = ({ className = "", showText = true, variant = "default" }: LogoProps) => {
  const ArrowIcon = () => (
    <svg 
      viewBox="0 0 24 24" 
      className="h-8 w-8" 
      fill="currentColor"
    >
      <path d="M4 12L20 12M20 12L14 6M20 12L14 18" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      />
    </svg>
  );

  const textColorClass = 
    variant === "white" ? "text-white" : 
    variant === "dark" ? "text-foreground" : 
    "text-primary";

  const iconColorClass = 
    variant === "white" ? "text-accent" : 
    "text-accent";

  return (
    <Link to="/" className={`flex items-center space-x-2 ${className}`}>
      <div className={iconColorClass}>
        <ArrowIcon />
      </div>
      {showText && (
        <span className={`text-xl font-bold ${textColorClass}`}>
          University Assist
        </span>
      )}
    </Link>
  );
};

export default Logo;