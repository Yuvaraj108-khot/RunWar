import { fetchTerritories } from './api.js';

let map;
let userMarker;
let pathLineId = 'user-path';
let territoriesSourceId = 'territories';

let pathCoords = [];

export function initMap() {
  const MAPBOX_TOKEN = window.MAPBOX_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN';
  mapboxgl.accessToken = MAPBOX_TOKEN;

  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [77.0, 28.0],
    zoom: 14
  });

  map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

  map.on('load', () => {
    map.addSource(territoriesSourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.addLayer({
      id: 'territory-fill',
      type: 'fill',
      source: territoriesSourceId,
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'isOwn'], true],
          '#00e5ff',
          '#ff3366'
        ],
        'fill-opacity': 0.25
      }
    });

    map.addLayer({
      id: 'territory-outline',
      type: 'line',
      source: territoriesSourceId,
      paint: {
        'line-color': [
          'case',
          ['==', ['get', 'isOwn'], true],
          '#00e5ff',
          '#ff3366'
        ],
        'line-width': 2
      }
    });

    map.addSource(pathLineId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      }
    });

    map.addLayer({
      id: 'user-path-layer',
      type: 'line',
      source: pathLineId,
      paint: {
        'line-color': '#00e5ff',
        'line-width': 4
      }
    });

    refreshTerritories();
  });

  map.on('moveend', () => {
    refreshTerritories();
  });
}

export function updateUserPosition(lng, lat) {
  if (!map) return;
  if (!userMarker) {
    userMarker = new mapboxgl.Marker({ color: '#00e5ff' })
      .setLngLat([lng, lat])
      .addTo(map);
    map.easeTo({ center: [lng, lat], duration: 500 });
  } else {
    userMarker.setLngLat([lng, lat]);
  }
}

export function extendPath(lng, lat) {
  pathCoords.push([lng, lat]);
  if (!map || !map.getSource(pathLineId)) return;
  map.getSource(pathLineId).setData({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: pathCoords
    }
  });
}

export function resetPath() {
  pathCoords = [];
  if (map && map.getSource(pathLineId)) {
    map.getSource(pathLineId).setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [] }
    });
  }
}

export async function refreshTerritories(currentUserId) {
  if (!map || !map.getBounds) return;
  const b = map.getBounds();
  const bounds = {
    minLng: b.getWest(),
    minLat: b.getSouth(),
    maxLng: b.getEast(),
    maxLat: b.getNorth()
  };
  try {
    const territories = await fetchTerritories(bounds);
    const featureCollection = {
      type: 'FeatureCollection',
      features: territories.map(t => ({
        type: 'Feature',
        geometry: t.polygon,
        properties: {
          ownerId: t.ownerId,
          isOwn: currentUserId && t.ownerId === currentUserId,
          protectionRemainingMs: t.protectionRemainingMs
        }
      }))
    };
    if (map.getSource(territoriesSourceId)) {
      map.getSource(territoriesSourceId).setData(featureCollection);
    }
  } catch (err) {
    console.error(err);
  }
}
