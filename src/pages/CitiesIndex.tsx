import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import SEOHead from '../components/SEOHead';

export default function CitiesIndex() {
  return (
    <>
      <SEOHead 
        title="Cities - University Assist"
        description="Explore German cities with universities"
      />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Cities</h1>
        <p className="text-muted-foreground mb-6">
          Open a city page like <code>/cities/aachen</code> to see universities in that city.
        </p>
        <ul className="space-y-2">
          <li><Link to="/cities/berlin" className="text-primary hover:underline">Berlin</Link></li>
          <li><Link to="/cities/munich" className="text-primary hover:underline">Munich</Link></li>
          <li><Link to="/cities/aachen" className="text-primary hover:underline">Aachen</Link></li>
          <li><Link to="/cities/hamburg" className="text-primary hover:underline">Hamburg</Link></li>
          <li><Link to="/cities/cologne" className="text-primary hover:underline">Cologne</Link></li>
        </ul>
      </main>
    </>
  );
}