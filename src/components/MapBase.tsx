import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN =
  'pk.eyJ1IjoidW5pYXNzaXN0MjUiLCJhIjoiY21lb3VvbHRyMGM0dTJrczVkNnB5NW5vNyJ9.y6UKbiF3yoJifkIR8hXYcA';
mapboxgl.accessToken = MAPBOX_TOKEN;

type Props = {
  children?: (args: { map: mapboxgl.Map }) => React.ReactNode;
  initialCenter?: [number, number];
  initialZoom?: number;
};

export default function MapBase({ children, initialCenter = [10.45, 51.16], initialZoom = 5 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: ref.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom
    });
    mapRef.current = map;
    return () => map.remove();
  }, []);

  return (
    <div style={{ width: '100%', height: '80vh', position: 'relative' }}>
      <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
      {mapRef.current && children ? children({ map: mapRef.current }) : null}
    </div>
  );
}