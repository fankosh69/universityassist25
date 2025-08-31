import { Link } from "react-router-dom";
import logoOptimized from "@/assets/logo-optimized.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "default" | "white" | "dark";
}

const Logo = ({ className = "", showText = false, variant = "default" }: LogoProps) => {
  return (
    <Link 
      to="/" 
      className={`flex items-center space-x-3 hover:opacity-80 transition-opacity ${className}`}
      title="University Assist - Back to Home"
    >
      <img 
        src={logoOptimized}
        alt="University Assist Logo" 
        className="h-16 w-auto object-contain max-w-[200px]"
        width="200"
        height="64"
        loading="lazy"
        decoding="async"
      />
      {showText && (
        <span className={`text-xl font-bold ${
          variant === "white" ? "text-white" : 
          variant === "dark" ? "text-foreground" : 
          "text-primary"
        }`}>
          University Assist
        </span>
      )}
    </Link>
  );
};

export default Logo;