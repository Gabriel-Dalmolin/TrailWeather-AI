import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle2, 
  CloudRain, 
  Thermometer, 
  Wind,
  Droplets,
  Mountain,
  ArrowLeft,
  TrendingUp,
  MapPin
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Point {
  lat: number;
  lng: number;
}

interface AnalysisDashboardProps {
  onBack: () => void;
  routeData: {
    points: Point[];
    distance: number;
  };
  dateTimeData: {
    startDate: string;
    startTime: string;
  };
}

// Mock data - in production this would come from weather APIs and AI analysis
const mockWeatherData = {
  overallRisk: 35,
  alerts: [
    {
      id: 1,
      type: "warning",
      title: "Chuva moderada prevista",
      description: "Possibilidade de 60% de chuva entre 14h-16h",
      severity: "medium",
    },
    {
      id: 2,
      type: "info",
      title: "Temperatura elevada",
      description: "Máxima de 32°C no período da tarde",
      severity: "low",
    },
  ],
  criticalPoints: [
    {
      id: 1,
      name: "Travessia de Rio",
      lat: -23.5505,
      lng: -46.6333,
      risk: 45,
      conditions: "Nível do rio normal, sem chuvas upstream",
    },
    {
      id: 2,
      name: "Área Exposta",
      lat: -23.5525,
      lng: -46.6343,
      risk: 25,
      conditions: "Vento moderado de 25 km/h",
    },
  ],
  recommendations: [
    "Iniciar trilha 1 hora mais cedo para evitar calor intenso",
    "Levar capa de chuva e proteção para equipamentos",
    "Aumentar consumo de água devido temperatura elevada",
    "Monitorar condições climáticas durante o percurso",
  ],
};

const AnalysisDashboard = ({ onBack, routeData, dateTimeData }: AnalysisDashboardProps) => {
  const getRiskColor = (risk: number) => {
    if (risk < 30) return "text-success";
    if (risk < 60) return "text-warning";
    return "text-destructive";
  };

  const getRiskBadge = (risk: number) => {
    if (risk < 30) return { variant: "default" as const, label: "Baixo", class: "bg-success" };
    if (risk < 60) return { variant: "default" as const, label: "Médio", class: "bg-warning" };
    return { variant: "destructive" as const, label: "Alto", class: "bg-destructive" };
  };

  const riskBadge = getRiskBadge(mockWeatherData.overallRisk);

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Análise Geral da Rota
          </CardTitle>
          <CardDescription>
            Análise completa das condições climáticas para {new Date(dateTimeData.startDate).toLocaleDateString('pt-BR')} às {dateTimeData.startTime}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Score de Risco</p>
              <p className={`text-4xl font-bold ${getRiskColor(mockWeatherData.overallRisk)}`}>
                {mockWeatherData.overallRisk}/100
              </p>
            </div>
            <Badge className={riskBadge.class}>
              Risco {riskBadge.label}
            </Badge>
          </div>
          <Progress value={mockWeatherData.overallRisk} className="h-2" />
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Distância</p>
              <p className="text-lg font-bold text-primary">{routeData.distance.toFixed(2)} km</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Pontos Analisados</p>
              <p className="text-lg font-bold text-secondary">{mockWeatherData.criticalPoints.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alertas e Avisos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockWeatherData.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${
                alert.severity === "high"
                  ? "bg-destructive/10 border-destructive"
                  : alert.severity === "medium"
                  ? "bg-warning/10 border-warning"
                  : "bg-muted border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                {alert.severity === "high" ? (
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                ) : alert.severity === "medium" ? (
                  <CloudRain className="h-5 w-5 text-warning mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Critical Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-destructive" />
            Pontos Críticos
          </CardTitle>
          <CardDescription>
            Locais que requerem atenção especial no percurso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockWeatherData.criticalPoints.map((point) => (
            <div
              key={point.id}
              className="p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-primary" />
                  {point.name}
                </h4>
                <Badge className={getRiskBadge(point.risk).class}>
                  {point.risk}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{point.conditions}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Recomendações da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {mockWeatherData.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Weather Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Thermometer className="h-8 w-8 text-destructive mb-2" />
              <p className="text-2xl font-bold">28°C</p>
              <p className="text-xs text-muted-foreground">Temperatura</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <CloudRain className="h-8 w-8 text-primary mb-2" />
              <p className="text-2xl font-bold">60%</p>
              <p className="text-xs text-muted-foreground">Chuva</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Wind className="h-8 w-8 text-accent mb-2" />
              <p className="text-2xl font-bold">25 km/h</p>
              <p className="text-xs text-muted-foreground">Vento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Droplets className="h-8 w-8 text-secondary mb-2" />
              <p className="text-2xl font-bold">75%</p>
              <p className="text-xs text-muted-foreground">Umidade</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        variant="outline"
        onClick={onBack}
        className="w-full"
        size="lg"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Nova Análise
      </Button>
    </div>
  );
};

export default AnalysisDashboard;
