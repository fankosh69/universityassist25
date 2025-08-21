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
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path 
        d="M19 12H5M12 5l-7 7 7 7" 
        strokeLinecap="round" 
        strokeLinejoin="round"
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
    <Link 
      to="/" 
      className={`flex items-center space-x-2 hover:opacity-80 transition-opacity ${className}`}
      title="Back to Home"
    >
      <div className={`${iconColorClass} hover:scale-110 transition-transform`}>
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