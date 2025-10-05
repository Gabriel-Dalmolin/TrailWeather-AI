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

interface Adversity {
  position: number; // 0-1 representing position along route
  type: string;
  level: "safe" | "warning" | "danger";
  description: string;
}

interface RouteMapProps {
  onRouteChange: (points: Point[], distance: number) => void;
}

const RouteMap = ({ onRouteChange }: RouteMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const [adversities, setAdversities] = useState<Adversity[]>([]);
  const segmentLinesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current).setView([-23.5505, -46.6333], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Add click handler to map
    map.on("click", (e: L.LeafletMouseEvent) => {
      const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPoints((prev) => [...prev, newPoint]);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markers.forEach((marker) => marker.remove());

    // Clear existing routing control
    if (routingControlRef.current) {
      mapRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Clear existing segment lines
    segmentLinesRef.current.forEach((line) => line.remove());
    segmentLinesRef.current = [];

    if (points.length === 0) {
      setMarkers([]);
      onRouteChange([], 0);
      return;
    }

    // Add new markers
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

      // Listen for route found
      routingControl.on("routesfound", (e: any) => {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const route = routes[0];
          const distanceKm = route.summary.totalDistance / 1000;
          
          // Generate simulated adversities
          const simulatedAdversities = generateAdversities();
          setAdversities(simulatedAdversities);
          
          // Draw colored segments based on adversities
          drawColoredSegments(route, simulatedAdversities);
          
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
  }, [points]);

  const handleRemovePoint = (index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
    toast.success("Point removed");
  };

  const handleClearAll = () => {
    setPoints([]);
    toast.info("Route cleared");
  };

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints((prev) => prev.slice(0, -1));
      toast.success("Last point removed");
    }
  };

  const generateAdversities = (): Adversity[] => {
    const adversityTypes = [
      { type: "Steep terrain", levels: ["warning", "danger"] },
      { type: "Flood-prone area", levels: ["warning", "danger"] },
      { type: "Strong wind", levels: ["warning", "danger"] },
      { type: "High temperature", levels: ["warning", "danger"] },
      { type: "River crossing", levels: ["warning", "danger"] },
      { type: "Exposed area", levels: ["warning", "danger"] },
      { type: "Irregular trail", levels: ["safe", "warning"] },
    ];

    const numAdversities = Math.floor(Math.random() * 4) + 2; // 2-5 adversities
    const adversities: Adversity[] = [];

    for (let i = 0; i < numAdversities; i++) {
      const position = Math.random();
      const adversityType = adversityTypes[Math.floor(Math.random() * adversityTypes.length)];
      const level = adversityType.levels[Math.floor(Math.random() * adversityType.levels.length)] as "safe" | "warning" | "danger";
      
      adversities.push({
        position,
        type: adversityType.type,
        level,
        description: `${adversityType.type} detected`,
      });
    }

    return adversities.sort((a, b) => a.position - b.position);
  };

  const drawColoredSegments = (route: any, adversities: Adversity[]) => {
    if (!mapRef.current) return;

    const coordinates = route.coordinates;
    if (!coordinates || coordinates.length < 2) return;

    // Clear existing segment lines
    segmentLinesRef.current.forEach((line) => line.remove());
    segmentLinesRef.current = [];

    // Create segments based on adversities
    const segments: { start: number; end: number; level: "safe" | "warning" | "danger" }[] = [];
    
    if (adversities.length === 0) {
      segments.push({ start: 0, end: 1, level: "safe" });
    } else {
      // Add segment before first adversity
      if (adversities[0].position > 0) {
        segments.push({ start: 0, end: adversities[0].position, level: "safe" });
      }

      // Add segments for each adversity
      adversities.forEach((adv, idx) => {
        const startPos = adv.position;
        const endPos = idx < adversities.length - 1 ? adversities[idx + 1].position : 1;
        const segmentLength = 0.1; // Each adversity affects 10% of the route
        
        // Adversity segment
        segments.push({ 
          start: startPos, 
          end: Math.min(startPos + segmentLength, endPos), 
          level: adv.level 
        });
        
        // Safe segment after adversity (if there's space)
        if (startPos + segmentLength < endPos) {
          segments.push({ 
            start: startPos + segmentLength, 
            end: endPos, 
            level: "safe" 
          });
        }
      });
    }

    const colorMap = {
      safe: "#10b981", // green
      warning: "#f59e0b", // amber
      danger: "#ef4444", // red
    };

    // Draw each segment
    segments.forEach((segment) => {
      const startIdx = Math.floor(segment.start * (coordinates.length - 1));
      const endIdx = Math.ceil(segment.end * (coordinates.length - 1));
      const segmentCoords = coordinates.slice(startIdx, endIdx + 1);

      if (segmentCoords.length >= 2) {
        const polyline = L.polyline(
          segmentCoords.map((c: any) => [c.lat, c.lng]),
          {
            color: colorMap[segment.level],
            weight: 6,
            opacity: 0.8,
          }
        ).addTo(mapRef.current!);

        segmentLinesRef.current.push(polyline);
      }
    });

    // Add markers for adversities
    adversities.forEach((adv) => {
      const idx = Math.floor(adv.position * (coordinates.length - 1));
      const coord = coordinates[idx];
      
      const icon = L.divIcon({
        className: "adversity-marker",
        html: `<div class="flex items-center justify-center w-6 h-6 ${
          adv.level === "danger" ? "bg-red-500" : adv.level === "warning" ? "bg-amber-500" : "bg-green-500"
        } text-white rounded-full border-2 border-white shadow-lg">⚠</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([coord.lat, coord.lng], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`<strong>${adv.type}</strong><br/>${adv.description}`);

      setMarkers((prev) => [...prev, marker]);
    });
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
