import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Map } from "lucide-react";
import RouteMap from "@/components/map/RouteMap";

interface Point {
  lat: number;
  lng: number;
}

interface RouteStepProps {
  onNext: () => void;
  onRouteChange: (points: Point[], distance: number) => void;
  routeData: {
    points: Point[];
    distance: number;
  };
}

const RouteStep = ({ onNext, onRouteChange, routeData }: RouteStepProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            <CardTitle>Desenhe sua rota</CardTitle>
          </div>
          <CardDescription>
            Clique no mapa para marcar pontos ao longo do percurso da sua trilha.
            Conecte os pontos para criar o trajeto completo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] w-full rounded-lg overflow-hidden border border-border shadow-md">
            <RouteMap onRouteChange={onRouteChange} />
          </div>

          {routeData.distance > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Distância Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {routeData.distance.toFixed(2)} km
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pontos Marcados</p>
                  <p className="text-2xl font-bold text-secondary">
                    {routeData.points.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={onNext}
            disabled={routeData.points.length < 2}
            className="w-full mt-6"
            size="lg"
          >
            Continuar para Horário
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteStep;
