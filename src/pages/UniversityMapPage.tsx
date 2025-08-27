import { useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import SEOHead from '../components/SEOHead';
import MapBase from '../components/MapBase';
import UniversityBySlug from '../components/UniversityBySlug';
import { deslugifyToLooseName } from '../lib/slug';

export default function UniversityMapPage() {
  const { slug } = useParams<{ slug: string }>();
  const universitySlug = slug || '';
  const displayName = deslugifyToLooseName(universitySlug)
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <>
      <SEOHead 
        title={`${displayName} - University Assist`}
        description={`View ${displayName} on the map`}
      />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{displayName}</h1>
        <MapBase initialZoom={6}>
          {({ map }) => <UniversityBySlug map={map} slug={universitySlug} />}
        </MapBase>
        <p className="text-muted-foreground mt-4">
          Showing a single university pin based on the URL slug.
        </p>
      </main>
    </>
  );
}