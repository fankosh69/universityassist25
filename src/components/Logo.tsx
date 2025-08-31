import { Link } from "react-router-dom";

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
        src="/lovable-uploads/fda0393f-0b68-4ef6-bd9a-3d02ac39e07b.png" 
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