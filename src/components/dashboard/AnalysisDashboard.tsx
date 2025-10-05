import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  MapPin,
  Clock,
  Droplet,
  Sun,
  Umbrella,
} from "lucide-react";

interface Point {
  lat: number;
  lng: number;
}

interface AnalysisDashboardProps {
  onBack: () => void;
  distance: number;
  routeData: {
    points: Point[];
    distance: number;
  };
  dateTimeData: {
    startDate: string;
    startTime: string;
  };
}

const mockWeatherData = {
  overallRisk: 35,
  alerts: [
    {
      id: 1,
      type: "warning",
      title: "Moderate rain expected",
      description: "60% chance of rain between 14:00-16:00",
      severity: "medium",
      timeWindow: "14:00-16:00",
      suggestions: [
        "Use waterproof jacket and cover equipment",
        "Avoid river crossings during the peak hour",
        "Consider postponing exposed ridge sections between 14:00-16:00",
      ],
    },
    {
      id: 2,
      type: "info",
      title: "High temperature",
      description: "Maximum of 32°C in the afternoon",
      severity: "low",
      timeWindow: "12:00-17:00",
      suggestions: [
        "Carry extra water and electrolyte tablets",
        "Start earlier to avoid hottest hours",
      ],
    },
  ],
  criticalPoints: [
    {
      id: 1,
      name: "River Crossing",
      lat: -23.5505,
      lng: -46.6333,
      risk: 45,
      conditions: "Normal river level, no upstream rain",
    },
    {
      id: 2,
      name: "Exposed Area",
      lat: -23.5525,
      lng: -46.6343,
      risk: 25,
      conditions: "Moderate wind of 25 km/h",
    },
  ],
  recommendations: [
    { text: "Start trail 1 hour earlier to avoid intense heat", icon: <Sun />, priority: 1 },
    { text: "Bring rain gear and equipment protection", icon: <Umbrella />, priority: 2 },
    { text: "Increase water intake due to high temperature", icon: <Droplet />, priority: 1 },
    { text: "Monitor weather conditions during the route", icon: <Thermometer />, priority: 3 },
  ],
  metrics: {
    temperature: 28,
    rainChance: 60,
    wind: 25,
    humidity: 75,
  },
};

const AnalysisDashboard = ({ onBack, distance, routeData, dateTimeData }: AnalysisDashboardProps) => {
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);
  const [checkedRecommendations, setCheckedRecommendations] = useState<number[]>([]);

  const avgSpeed = 4.5;
  const estimatedHours = distance / avgSpeed;
  const hours = Math.floor(estimatedHours);
  const minutes = Math.round((estimatedHours - hours) * 60);

  const risk = mockWeatherData.overallRisk;

  const getRiskSemantic = (r: number) => {
    if (r < 30) return { label: "Low", color: "green" };
    if (r < 60) return { label: "Medium", color: "yellow" };
    return { label: "High", color: "red" };
  };

  const riskSemantic = getRiskSemantic(risk);

  const getBadgeClasses = (r: number) => {
    if (r < 30) return "bg-green-100 text-green-800";
    if (r < 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getTextColor = (r: number) => {
    if (r < 30) return "text-green-600";
    if (r < 60) return "text-yellow-600";
    return "text-red-600";
  };

  const interpretRisk = (r: number) => {
    if (r < 30)
      return "Low risk: favorable conditions with reduced chance of accidents; maintain standard precautions.";
    if (r < 60)
      return "Medium risk: minor incidents possible. Take precautions (waterproof gear, avoid exposed areas during alerts).";
    return "High risk: dangerous conditions — consider postponing or strictly follow safety recommendations.";
  };

  const toggleRecommendation = (index: number) => {
    setCheckedRecommendations(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const newDate = new Date(dateTimeData.startDate);
  newDate.setDate(newDate.getDate() + 1);

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Overall Route Analysis
          </CardTitle>
          <CardDescription>
            Complete weather analysis for {new Date(newDate).toLocaleDateString("en-US")} at {dateTimeData.startTime}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Risk Score</p>
              <p className={`text-4xl font-bold ${getTextColor(risk)}`}>{risk}/100</p>
              <div className="mt-2 text-sm text-muted-foreground max-w-xl">
                <strong>What this means:</strong>
                <p className="mt-1">{interpretRisk(risk)}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getBadgeClasses(risk)}`}>
                {riskSemantic.label} Risk
              </span>
            </div>
          </div>
          <div aria-hidden className="w-full rounded-full h-3 bg-gray-200 overflow-hidden">
            <div className="h-full transition-[width]" style={{ width: `${risk}%`, background: "linear-gradient(90deg, #34D399 0%, #FBBF24 50%, #F87171 100%)" }} />
          </div>
        </CardContent>
      </Card>

      {/* Duration */}
      {distance > 0 && (
        <div className="p-4 bg-gradient-to-r from-primary to-secondary rounded-lg text-primary-foreground">
          <p className="text-sm font-medium mb-2">Estimated Duration</p>
          <p className="text-3xl font-bold">{hours}h {minutes}min</p>
          <p className="text-xs mt-2 opacity-90">Based on average speed of {avgSpeed} km/h and distance of {distance.toFixed(2)} km</p>
        </div>
      )}

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alerts and Warnings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockWeatherData.alerts.map(alert => {
            const isOpen = expandedAlert === alert.id;
            return (
              <div key={alert.id} onClick={() => setExpandedAlert(isOpen ? null : alert.id)} className={`p-4 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 transition-colors ${alert.severity === 'high' ? 'bg-red-50 border-red-200' : alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-muted border-border'}`}>
                <div className="flex items-start gap-3">
                  {alert.severity === 'high' ? <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" /> : alert.severity === 'medium' ? <CloudRain className="h-5 w-5 text-yellow-600 mt-0.5" /> : <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.timeWindow && <div className="flex items-center text-xs text-muted-foreground gap-1"><Clock className="h-4 w-4" /><span>{alert.timeWindow}</span></div>}
                        <Badge className={alert.severity === 'high' ? 'bg-red-100 text-red-800' : alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>{alert.severity?.toUpperCase()}</Badge>
                      </div>
                    </div>
                    {isOpen && <div className="mt-3 text-sm text-muted-foreground"><p className="mb-2">Safety Suggestions:</p><ul className="list-disc pl-5 space-y-1">{alert.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Critical Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-destructive" />
            Critical Points
          </CardTitle>
          <CardDescription>Locations requiring special attention along the route. Risk percentages indicate severity, not probability.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockWeatherData.criticalPoints.map(point => (
            <div key={point.id} className="p-4 border border-border rounded-lg hover:border-primary transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm flex items-center gap-2"><Mountain className="h-4 w-4 text-primary" />{point.name}</h4>
                <Badge className={getBadgeClasses(point.risk)}>{point.risk}%</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{point.conditions}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" />AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {mockWeatherData.recommendations.sort((a, b) => a.priority - b.priority).map((rec, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">{rec.icon}{rec.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Weather Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <Thermometer className="h-8 w-8 text-red-600 mb-2" />
            <p className="text-2xl font-bold">{mockWeatherData.metrics.temperature}°C</p>
            <p className="text-xs text-muted-foreground">Temperature</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <CloudRain className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">{mockWeatherData.metrics.rainChance}%</p>
            <p className="text-xs text-muted-foreground">Rain</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <Wind className={`h-8 w-8 mb-2 ${mockWeatherData.metrics.wind > 30 ? 'text-red-600' : 'text-accent'}`} />
            <p className="text-2xl font-bold">{mockWeatherData.metrics.wind} km/h</p>
            <p className="text-xs text-muted-foreground">Wind</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <Droplets className="h-8 w-8 text-secondary mb-2" />
            <p className="text-2xl font-bold">{mockWeatherData.metrics.humidity}%</p>
            <p className="text-xs text-muted-foreground">Humidity</p>
          </CardContent>
        </Card>
      </div>

      <Button variant="outline" onClick={onBack} className="w-full" size="lg"><ArrowLeft className="mr-2 h-4 w-4" />New Analysis</Button>
    </div>
  );
};

export default AnalysisDashboard;
