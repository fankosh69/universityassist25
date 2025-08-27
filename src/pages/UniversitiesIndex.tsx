import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { slugify } from '../lib/slug';
import Navigation from '../components/Navigation';
import SEOHead from '../components/SEOHead';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function UniversitiesIndex() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (q.trim()) {
      navigate(`/universities/${slugify(q)}`);
    }
  };

  return (
    <>
      <SEOHead 
        title="Universities - University Assist"
        description="Search for German universities"
      />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Universities</h1>
        <div className="flex gap-4 mb-6 max-w-2xl">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a university name, e.g., Humboldt University Berlin"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={!q.trim()}>
            Open
          </Button>
        </div>
        <p className="text-muted-foreground">
          Or go directly: /universities/humboldt-university-berlin
        </p>
      </main>
    </>
  );
}