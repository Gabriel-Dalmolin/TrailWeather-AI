import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Map } from "lucide-react";
import RouteMap from "@/components/map/RouteMap";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface Point {
  lat: number;
  lng: number;
}

interface RouteStepProps {
  onNext: () => void;
  onBack: () => void;
  onRouteChange: (points: Point[], distance: number) => void;
  routeData: {
    points: Point[];
    distance: number;
  };
}

const RouteStep = ({ onNext, onBack, onRouteChange, routeData }: RouteStepProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            <CardTitle>Draw your route</CardTitle>
          </div>
          <CardDescription>
            Click on the map to mark points along your trail.
            Connect the points to create the complete route.
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
                  <p className="text-sm text-muted-foreground">Total Distance</p>
                  <p className="text-2xl font-bold text-primary">
                    {routeData.distance.toFixed(2)} km
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marked Points</p>
                  <p className="text-2xl font-bold text-secondary">
                    {routeData.points.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 items-center mt-6">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <TooltipProvider>
              <Tooltip>
                {/* Usamos span como trigger para permitir tooltip em botão desabilitado */}
                <TooltipTrigger asChild>
                  <span className="inline-block w-2/3">
                    <Button
                      onClick={onNext}
                      disabled={routeData.points.length < 2}
                      className="w-full"
                      size="lg"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </span>
                </TooltipTrigger>

                {routeData.points.length < 2 && (
                  <TooltipContent
                    side="top"
                    className="bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg z-[9999] text-sm font-medium"
                  >
                    Please, select at least 2 points in the map
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>


          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default RouteStep;
