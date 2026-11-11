import { TrackPointResponse } from "@/api/workoutService";
import { splitIntoSegments } from "@/utils/workoutAnalysis";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
} from "@maplibre/maplibre-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
const ROUTE_COLOR = "#FC4C02";
const START_COLOR = "#30D158";
const END_COLOR = "#FF453A";
type Bounds = [west: number, south: number, east: number, north: number];

function buildRouteGeoJSON(
  points: TrackPointResponse[],
): GeoJSON.FeatureCollection {
  const lines = splitIntoSegments(points)
    .filter((segment) => segment.length >= 2)
    .map((segment) => segment.map((p) => [p.longitude, p.latitude]));

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "MultiLineString", coordinates: lines },
      },
    ],
  };
}

function buildEndpointsGeoJSON(
  points: TrackPointResponse[],
): GeoJSON.FeatureCollection {
  const start = points[0];
  const end = points[points.length - 1];

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { kind: "end" },
        geometry: {
          type: "Point",
          coordinates: [end.longitude, end.latitude],
        },
      },
      {
        type: "Feature",
        properties: { kind: "start" },
        geometry: {
          type: "Point",
          coordinates: [start.longitude, start.latitude],
        },
      },
    ],
  };
}

function computeBounds(points: TrackPointResponse[]): Bounds {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const p of points) {
    west = Math.min(west, p.longitude);
    east = Math.max(east, p.longitude);
    north = Math.max(north, p.latitude);
    south = Math.min(south, p.latitude);
  }
  return [west, south, east, north];
}

export function RouteMap({ points }: { points: TrackPointResponse[] }) {
  const route = useMemo(() => buildRouteGeoJSON(points), [points]);
  const endpoints = useMemo(
    () => (points.length > 0 ? buildEndpointsGeoJSON(points) : null),
    [points],
  );
  const bounds = useMemo(
    () => (points.length > 0 ? computeBounds(points) : null),
    [points],
  );

  if (!endpoints || !bounds) {
    return (
      <View style={[styles.container, styles.empty]}>
        <Text style={styles.emptyText}>Ehhez az edzéshez nincs GPS-adat</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={MAP_STYLE_URL}
        logo={false}
        compass={false}
        dragPan={false}
        touchZoom={true}
        doubleTapZoom={true}
        touchRotate={false}
        touchPitch={false}
      >
        <Camera
          maxZoom={17}
          initialViewState={{
            bounds,
            padding: { top: 40, right: 40, left: 40, bottom: 40 },
          }}
        />

        <GeoJSONSource id="route" data={route}>
          <Layer
            id="route-casing"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{
              "line-color": "#000",
              "line-width": 7,
              "line-opacity": 0.5,
            }}
          />
          <Layer
            id="route-line"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{
              "line-color": ROUTE_COLOR,
              "line-width": 4,
            }}
          />
        </GeoJSONSource>
        <GeoJSONSource id="endpoints" data={endpoints}>
          <Layer
            type="circle"
            id="endpoints-circle"
            paint={{
              "circle-radius": 7,
              "circle-color": [
                "match",
                ["get", "kind"],
                "start",
                START_COLOR,
                END_COLOR,
              ],
              "circle-stroke-color": "#FFF",
              "circle-stroke-width": 2.5,
            }}
          />
        </GeoJSONSource>
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 280, backgroundColor: "#1A1A1A" },
  map: { flex: 1 },
  empty: { justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#8E8E93", fontSize: 14 },
});
