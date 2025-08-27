import { useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import SEOHead from '../components/SEOHead';
import MapBase from '../components/MapBase';
import VectorUniversitiesLayer from '../components/VectorUniversitiesLayer';

export default function CityMapPage() {
  const { city } = useParams<{ city: string }>();
  const cityName = city || '';
  const displayName = cityName.charAt(0).toUpperCase() + cityName.slice(1);

  return (
    <>
      <SEOHead 
        title={`Universities in ${displayName} - University Assist`}
        description={`Explore universities in ${displayName}, Germany`}
      />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Universities in {displayName}</h1>
        <MapBase>
          {({ map }) => <VectorUniversitiesLayer map={map} cityFilter={cityName} />}
        </MapBase>
      </main>
    </>
  );
}