export function RegionsHeroSection() {
  return (
    <div className="relative bg-gradient-to-br from-primary via-secondary to-accent py-20 px-4">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)] animate-pulse" />
      </div>
      
      <div className="relative max-w-4xl mx-auto text-center text-white">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
          Explore German Regions
        </h1>
        <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
          Germany is divided into 16 federal states (Bundesländer). Each region offers unique 
          educational opportunities, cultural experiences, and living environments.
        </p>
      </div>
    </div>
  );
}
