export function CitiesHeroSection() {
  return (
    <div className="relative bg-gradient-to-br from-primary via-primary/90 to-secondary py-20 px-4 mb-12">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-10" />
      
      <div className="relative container mx-auto text-center">
        <p className="text-lg text-white/90 mb-4 uppercase tracking-wide">Living in Germany</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
          DISCOVER UNIVERSITY CITIES
        </h1>
        <p className="text-xl text-white/90 max-w-3xl mx-auto">
          From A for Aachen to Z for Zwickau, each city has its own special features. Which one will you discover?
        </p>
      </div>
    </div>
  );
}