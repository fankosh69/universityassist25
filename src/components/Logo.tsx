import { Link } from "react-router-dom";
import logoImage from "@/assets/university-assist-logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "default" | "white" | "dark";
}

const Logo = ({ className = "", showText = true, variant = "default" }: LogoProps) => {
  return (
    <Link 
      to="/" 
      className={`flex items-center space-x-3 hover:opacity-80 transition-opacity ${className}`}
      title="University Assist - Back to Home"
    >
      <img 
        src={logoImage} 
        alt="University Assist Logo" 
        className="h-12 w-auto object-contain"
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