import { Badge } from "@/components/ui/badge";

interface CityHeroProps {
  cityName: string;
  heroImageUrl?: string;
  hashtags?: string[];
  subtitle?: string;
}

export function CityHero({ cityName, heroImageUrl, hashtags, subtitle }: CityHeroProps) {
  const defaultImage = "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1920&q=80";
  
  return (
    <div className="relative h-[500px] lg:h-[600px] w-full overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 transition-transform duration-700"
        style={{
          backgroundImage: `url(${heroImageUrl || defaultImage})`,
        }}
      />
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        {/* Hashtags */}
        {hashtags && hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-6 animate-fade-in">
            {hashtags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-sm px-3 py-1 bg-primary/20 text-white border-white/20 hover:bg-primary/30"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* City Name */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 animate-fade-in-up">
          {cityName.toUpperCase()}
        </h1>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-xl sm:text-2xl lg:text-3xl text-white/90 max-w-3xl animate-fade-in-up delay-100">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}