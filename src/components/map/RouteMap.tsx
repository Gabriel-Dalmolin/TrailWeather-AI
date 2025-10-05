import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { Button } from "@/components/ui/button";
import { Trash2, Undo } from "lucide-react";
import { toast } from "sonner";

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Point {
  lat: number;
  lng: number;
}

// agora adversities pertencem explicitamente a um segmento entre dois waypoints
interface Adversity {
  startPointIndex: number; // index do waypoint inicial do segmento
  endPointIndex: number; // index do waypoint final do segmento (start+1 geralmente)
  t: number; // 0-1 posição relativa ao segmento (0 = no início do segmento, 1 = fim)
  type: string;
  level: "safe" | "warning" | "danger";
  description: string;
}

interface RouteMapProps {
  onRouteChange: (points: Point[], distance: number) => void;
}

const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];
const DEFAULT_ZOOM = 12;

const RouteMap = ({ onRouteChange }: RouteMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const [adversities, setAdversities] = useState<Adversity[]>([]);
  const segmentLinesRef = useRef<L.Polyline[]>([]);

  // Adversity markers separados (para não confundir com os markers de pontos)
  const adversityMarkersRef = useRef<L.Marker[]>([]);

  // User location marker & accuracy circle
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);

  // Hover marker to show pin under mouse
  const hoverMarkerRef = useRef<L.Marker | null>(null);

  // Helper to create & initialize map
  const createMap = (center: [number, number], zoom = DEFAULT_ZOOM) => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(center, zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Click handler to add points
    map.on("click", (e: L.LeafletMouseEvent) => {
      const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPoints((prev) => [...prev, newPoint]);
    });

    // --- Hover pin logic: show a pin while pointer is over the map ---
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const latlng = e.latlng;
      if (!latlng) return;

      // Create icon once
      const icon = L.divIcon({
        className: "hover-pin-marker",
        html: `<div style="
          width:18px;height:18px;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background:#ef4444;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
          display:block;
          "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      if (!hoverMarkerRef.current) {
        hoverMarkerRef.current = L.marker(latlng, {
          icon,
          interactive: false, // so it doesn't steal events
          zIndexOffset: 1000,
        }).addTo(map);
      } else {
        hoverMarkerRef.current.setLatLng(latlng);
      }
    };

    const handleMouseOut = () => {
      if (hoverMarkerRef.current) {
        try {
          map.removeLayer(hoverMarkerRef.current);
        } catch (e) {
          // ignore if already removed
        }
        hoverMarkerRef.current = null;
      }
    };

    map.on("mousemove", handleMouseMove);
    // mouseout triggers when pointer leaves the map container
    map.on("mouseout", handleMouseOut);

    // Store map reference
    mapRef.current = map;

    // Ensure we remove hover marker and listeners on map removal / cleanup later.
    // (The overall component cleanup removes the map; see useEffect cleanup.)
  };

  // Set or update "You are here" marker + accuracy circle
  const setUserLocationOnMap = (lat: number, lng: number, accuracy?: number) => {
    if (!mapRef.current) return;

    const latlng = L.latLng(lat, lng);

    // Marker
    if (!userMarkerRef.current) {
      const icon = L.divIcon({
        className: "user-location-marker",
        html:
          `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;
                        background:rgba(14,165,233,0.95);color:white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-weight:600;">
            •
          </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      userMarkerRef.current = L.marker(latlng, { icon }).addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLatLng(latlng);
    }

    // Accuracy circle (optional)
    if (typeof accuracy === "number") {
      if (!userCircleRef.current) {
        userCircleRef.current = L.circle(latlng, {
          radius: accuracy,
          color: "rgba(14,165,233,0.25)",
          fillColor: "rgba(14,165,233,0.12)",
          weight: 1,
        }).addTo(mapRef.current);
      } else {
        userCircleRef.current.setLatLng(latlng);
        userCircleRef.current.setRadius(accuracy);
      }
    }
  };

  // Request location and initialize map accordingly
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if ("geolocation" in navigator) {
      // Prompt user for location. Use reasonable options.
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          createMap([latitude, longitude], 13);

          // Put user location marker and circle
          setUserLocationOnMap(latitude, longitude, accuracy);

          // Optionally start watching to update user position live
          try {
            const watchId = navigator.geolocation.watchPosition(
              (pos) => {
                const { latitude: la, longitude: lo, accuracy: acc } = pos.coords;
                setUserLocationOnMap(la, lo, acc);
              },
              (err) => {
                // non-fatal: just stop watching
                console.debug("watchPosition error:", err);
              },
              { enableHighAccuracy: false, maximumAge: 5000, timeout: 10000 }
            );
            geoWatchIdRef.current = watchId;
          } catch (e) {
            // ignore watch errors in some environments
            console.debug("watchPosition not supported or failed", e);
          }
        },
        (error) => {
          // Permission denied or other error -> fallback to default center
          console.warn("Geolocation error, falling back to default:", error);
          toast.warning("Location not available — using standard map view.");
          createMap(DEFAULT_CENTER, DEFAULT_ZOOM);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      // Geolocation not supported
      toast.warning("Browser does not support geolocation — using standard view.");
      createMap(DEFAULT_CENTER, DEFAULT_ZOOM);
    }

    // Cleanup: remove map and clear watch if present
    return () => {
      if (geoWatchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      if (mapRef.current) {
        // remove any hover marker first
        if (hoverMarkerRef.current) {
          try {
            mapRef.current.removeLayer(hoverMarkerRef.current);
          } catch (e) {
            /* ignore */
          }
          hoverMarkerRef.current = null;
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
      userMarkerRef.current = null;
      userCircleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: find index of closest coordinate in route.coordinates to a lat/lng
  const findClosestIndex = (coordinates: any[], lat: number, lng: number) => {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < coordinates.length; i++) {
      const c = coordinates[i];
      const dLat = c.lat - lat;
      const dLng = c.lon !== undefined ? c.lon - lng : c.lng - lng; // depending on shape
      const distSq = dLat * dLat + dLng * dLng;
      if (distSq < bestDist) {
        bestDist = distSq;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  // Gera adversities apenas para um segmento (startIndex -> endIndex)
  const generateAdversitiesForSegment = (startIndex: number, endIndex: number): Adversity[] => {
    const adversityTypes = [
      { type: "Steep terrain", levels: ["warning", "danger"] },
      { type: "Flood-prone area", levels: ["warning", "danger"] },
      { type: "Strong wind", levels: ["warning", "danger"] },
      { type: "High temperature", levels: ["warning", "danger"] },
      { type: "River crossing", levels: ["warning", "danger"] },
      { type: "Exposed area", levels: ["warning", "danger"] },
      { type: "Irregular trail", levels: ["safe", "warning"] },
    ];

    const numAdversities = Math.floor(Math.random() * 4) + 2; // 2-5 adversities on this segment
    const advs: Adversity[] = [];

    for (let i = 0; i < numAdversities; i++) {
      const t = Math.random(); // position relative to segment
      const adversityType = adversityTypes[Math.floor(Math.random() * adversityTypes.length)];
      const level = adversityType.levels[Math.floor(Math.random() * adversityType.levels.length)] as "safe" | "warning" | "danger";

      advs.push({
        startPointIndex: startIndex,
        endPointIndex: endIndex,
        t,
        type: adversityType.type,
        level,
        description: `${adversityType.type} detected`,
      });
    }

    // ordenar por t para estabilidade
    return advs.sort((a, b) => a.t - b.t);
  };

  // Desenha segmentos coloridos e markers com base nas adversities (que são relativas a segmentos)
  const drawColoredSegments = (route: any, adversitiesList: Adversity[]) => {
    if (!mapRef.current) return;

    const coordinates = route.coordinates;
    if (!coordinates || coordinates.length < 2) return;

    // Clear existing segment lines
    segmentLinesRef.current.forEach((line) => line.remove());
    segmentLinesRef.current = [];

    // Clear existing adversity markers
    adversityMarkersRef.current.forEach((m) => m.remove());
    adversityMarkersRef.current = [];

    // Mapeia cada adversity (segment + t) para um índice absoluto no array coordinates
    const length = coordinates.length;
    const mappedAdversities = adversitiesList.map((adv) => {
      // pontos do segmento (user-defined points)
      const startPt = points[adv.startPointIndex];
      const endPt = points[adv.endPointIndex];

      // achar índices aproximados no route.coordinates que correspondem aos waypoints
      const startIdx = findClosestIndex(coordinates, startPt.lat, startPt.lng);
      const endIdx = findClosestIndex(coordinates, endPt.lat, endPt.lng);

      // garantir ordem crescente
      const segStart = Math.min(startIdx, endIdx);
      const segEnd = Math.max(startIdx, endIdx);

      // valor absoluto do índice da adversity
      const advIdx = Math.round(segStart + adv.t * (segEnd - segStart));
      const clampedAdvIdx = Math.max(0, Math.min(length - 1, advIdx));
      const normalizedPos = clampedAdvIdx / (length - 1);

      return {
        ...adv,
        advIdx: clampedAdvIdx,
        normalizedPos,
        coord: coordinates[clampedAdvIdx],
      };
    });

    // Ordenar adversidades pela posição absoluta
    mappedAdversities.sort((a, b) => a.advIdx - b.advIdx);

    // Construir segmentos entre adversities para colorir
    const segments: { startIdx: number; endIdx: number; level: "safe" | "warning" | "danger" }[] = [];

    if (mappedAdversities.length === 0) {
      segments.push({ startIdx: 0, endIdx: length - 1, level: "safe" });
    } else {
      // segmento antes da primeira adversity
      if (mappedAdversities[0].advIdx > 0) {
        segments.push({ startIdx: 0, endIdx: mappedAdversities[0].advIdx, level: "safe" });
      }

      // para cada adversity, adicionar segmento (ela mesma) e depois safe até a próxima adversity
      const ADV_SEG_LEN = Math.max(1, Math.round((coordinates.length - 1) * 0.02)); // adversidade afeta ~2% dos pontos (ajustável)
      for (let i = 0; i < mappedAdversities.length; i++) {
        const adv = mappedAdversities[i];
        const advStart = adv.advIdx;
        const advEnd = Math.min(length - 1, advStart + ADV_SEG_LEN);

        segments.push({ startIdx: advStart, endIdx: advEnd, level: adv.level });

        const nextStart = advEnd + 1;
        const nextAdvIdx = i < mappedAdversities.length - 1 ? mappedAdversities[i + 1].advIdx : null;
        const safeEnd = nextAdvIdx !== null ? nextAdvIdx : length - 1;
        if (nextStart <= safeEnd) {
          segments.push({ startIdx: nextStart, endIdx: safeEnd, level: "safe" });
        }
      }
    }

    const colorMap: Record<string, string> = {
      safe: "#10b981",
      warning: "#f59e0b",
      danger: "#ef4444",
    };

    // Desenhar segmentos
    segments.forEach((segment) => {
      const { startIdx, endIdx } = segment;
      if (endIdx <= startIdx) return;
      const segmentCoords = coordinates.slice(startIdx, endIdx + 1);
      if (segmentCoords.length < 2) return;

      const polyline = L.polyline(
        segmentCoords.map((c: any) => [c.lat, c.lng]),
        {
          color: colorMap[segment.level],
          weight: 6,
          opacity: 0.8,
        }
      ).addTo(mapRef.current!);

      segmentLinesRef.current.push(polyline);
    });

    // Adversity markers
    mappedAdversities.forEach((adv) => {
      const c = adv.coord;
      const icon = L.divIcon({
        className: "adversity-marker",
        html: `<div class="flex items-center justify-center w-6 h-6 ${adv.level === "danger" ? "bg-red-500" : adv.level === "warning" ? "bg-amber-500" : "bg-green-500"
          } text-white rounded-full border-2 border-white shadow-lg">⚠</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([c.lat, c.lng], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`<strong>${adv.type}</strong><br/>${adv.description}`);

      adversityMarkersRef.current.push(marker);
    });
  };

  // Routing / markers / adversities effect
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing point markers (userMarker is NOT part of markers state)
    markers.forEach((marker) => marker.remove());

    // Clear existing routing control
    if (routingControlRef.current) {
      mapRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Clear existing segment lines (we will redraw later on routesfound)
    segmentLinesRef.current.forEach((line) => line.remove());
    segmentLinesRef.current = [];

    // Do not clear adversity markers here — we'll redraw them in drawColoredSegments based on state
    // But if no points, clear everything
    if (points.length === 0) {
      setMarkers([]);
      // remove adversity markers and adversities state
      adversityMarkersRef.current.forEach((m) => m.remove());
      adversityMarkersRef.current = [];
      setAdversities([]);
      onRouteChange([], 0);
      return;
    }

    // Add new markers for points
    const newMarkers = points.map((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div class="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full border-2 border-background shadow-md font-semibold text-sm">${index + 1}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      }).addTo(mapRef.current!);

      marker.on("click", () => {
        handleRemovePoint(index);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Create route with routing machine
    if (points.length > 1) {
      const waypoints = points.map((p) => L.latLng(p.lat, p.lng));

      const routingControl = (L.Routing as any).control({
        waypoints,
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: false,
        showAlternatives: false,
        lineOptions: {
          styles: [{ color: "#0ea5e9", weight: 4, opacity: 0.7 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        show: false,
        createMarker: () => null,
      }).addTo(mapRef.current!);

      routingControlRef.current = routingControl;

      if (routingControl.getContainer()) {
        const container = routingControl.getContainer();
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }


      // Listen for route found
      routingControl.on("routesfound", (e: any) => {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const route = routes[0];
          const distanceKm = route.summary.totalDistance / 1000;

          // Gerar adversities somente para o último segmento, se ainda não existirem
          const lastStart = points.length - 2;
          const lastEnd = points.length - 1;

          setAdversities((prev) => {
            const hasForLast = prev.some(
              (a) => a.startPointIndex === lastStart && a.endPointIndex === lastEnd
            );

            const toAdd = hasForLast ? [] : generateAdversitiesForSegment(lastStart, lastEnd);
            const updated = [...prev, ...toAdd];

            // Desenhar imediatamente usando updated
            drawColoredSegments(route, updated);

            return updated;
          });

          onRouteChange(points, distanceKm);
        }
      });

      // Handle routing errors
      routingControl.on("routingerror", () => {
        toast.error("Unable to calculate route");
        onRouteChange(points, 0);
      });
    } else {
      onRouteChange(points, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  // Remove point and adapt adversities (drop those that referenced the removed point; shift indices)
  const handleRemovePoint = (index: number) => {
    setPoints((prevPts) => {
      const newPts = prevPts.filter((_, i) => i !== index);

      // Update adversities: remove those that referenced the removed point; shift indices > removed index
      setAdversities((prevAdvs) => {
        const updated: Adversity[] = [];
        prevAdvs.forEach((adv) => {
          if (adv.startPointIndex === index || adv.endPointIndex === index) {
            // segment destroyed -> drop
            return;
          }
          let s = adv.startPointIndex;
          let e = adv.endPointIndex;
          if (s > index) s--;
          if (e > index) e--;
          updated.push({ ...adv, startPointIndex: s, endPointIndex: e });
        });
        return updated;
      });

      toast.success("Point removed");
      return newPts;
    });
  };

  const handleClearAll = () => {
    setPoints([]);
    // Clear adversities and markers
    setAdversities([]);
    adversityMarkersRef.current.forEach((m) => m.remove());
    adversityMarkersRef.current = [];
    toast.info("Route cleared");
  };

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints((prev) => {
        const newPts = prev.slice(0, -1);

        // Remove adversities that referenced the last segment(s)
        setAdversities((prevAdvs) => prevAdvs.filter((a) => a.endPointIndex < newPts.length));

        toast.success("Last point removed");
        return newPts;
      });
    }
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full rounded-lg" />

      {points.length > 0 && (
        <div className="absolute top-4 right-4 flex gap-2 z-[1000]">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleUndo}
            className="shadow-lg"
          >
            <Undo className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClearAll}
            className="shadow-lg"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-card p-3 rounded-lg shadow-lg border border-border z-[1000] max-w-xs">
        <p className="text-sm font-medium text-foreground">
          Marked points: <span className="text-primary">{points.length}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Click on the map to add points
        </p>

        {adversities.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs font-semibold text-foreground mb-2">Legend:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-muted-foreground">Safe</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-xs text-muted-foreground">Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-muted-foreground">Danger</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteMap;
