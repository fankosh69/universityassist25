interface RegionHeroProps {
  regionName: string;
  cityCount: number;
  totalUniversities?: number;
  totalStudents?: number;
  heroImageUrl?: string;
  hashtags?: string[];
}

export function RegionHero({
  regionName,
  cityCount,
  totalUniversities,
  totalStudents,
  heroImageUrl,
  hashtags,
}: RegionHeroProps) {
  return (
    <div className="relative h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt={`${regionName} region`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary via-secondary to-accent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-12">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg">
            {regionName}
          </h1>
          
          <div className="flex flex-wrap gap-4 text-white/90">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="font-semibold">{cityCount}</span>
              <span>Cities</span>
            </div>
            {totalUniversities && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="font-semibold">{totalUniversities}</span>
                <span>Universities</span>
              </div>
            )}
            {totalStudents && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="font-semibold">{totalStudents.toLocaleString()}</span>
                <span>Students</span>
              </div>
            )}
          </div>

          {hashtags && hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="text-white/80 text-sm bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
