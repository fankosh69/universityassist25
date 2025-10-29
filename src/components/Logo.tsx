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
      <picture className="bg-transparent">
        <source srcSet="/lovable-uploads/logo-new-colors.webp" type="image/webp" />
        <img 
          src="/lovable-uploads/logo-new-colors.png" 
          alt="University Assist Logo" 
          className="h-10 w-auto object-contain max-w-[160px] bg-transparent"
          width="160"
          height="40"
          loading="lazy"
          decoding="async"
          style={{ filter: 'none', backgroundColor: 'transparent' }}
        />
      </picture>
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