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

interface RouteMapProps {
  onRouteChange: (points: Point[], distance: number) => void;
}

const RouteMap = ({ onRouteChange }: RouteMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const routingControlRef = useRef<L.Routing.Control | null>(null);

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
          onRouteChange(points, distanceKm);
        }
      });

      // Handle routing errors
      routingControl.on("routingerror", () => {
        toast.error("Não foi possível calcular a rota");
        onRouteChange(points, 0);
      });
    } else {
      onRouteChange(points, 0);
    }
  }, [points]);

  const handleRemovePoint = (index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
    toast.success("Ponto removido");
  };

  const handleClearAll = () => {
    setPoints([]);
    toast.info("Rota limpa");
  };

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints((prev) => prev.slice(0, -1));
      toast.success("Último ponto removido");
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
            Desfazer
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClearAll}
            className="shadow-lg"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-card p-3 rounded-lg shadow-lg border border-border z-[1000]">
        <p className="text-sm font-medium text-foreground">
          Pontos marcados: <span className="text-primary">{points.length}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Clique no mapa para adicionar pontos
        </p>
      </div>
    </div>
  );
};

export default RouteMap;
