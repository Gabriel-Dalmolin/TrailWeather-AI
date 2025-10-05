import { useState } from "react";
import Header from "@/components/layout/Header";
import WizardSteps from "@/components/wizard/WizardSteps";
import RouteStep from "@/components/wizard/RouteStep";
import DateTimeStep from "@/components/wizard/DateTimeStep";
import AnalysisDashboard from "@/components/dashboard/AnalysisDashboard";

interface Point {
  lat: number;
  lng: number;
}

const WIZARD_STEPS = [
  {
    id: 1,
    title: "Route",
    description: "Draw the path",
  },
  {
    id: 2,
    title: "Schedule",
    description: "Start date and time",
  },
  {
    id: 3,
    title: "Analysis",
    description: "Weather results",
  },
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [routeData, setRouteData] = useState<{ points: Point[]; distance: number }>({
    points: [],
    distance: 0,
  });
  const [dateTimeData, setDateTimeData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    startTime: "08:00",
  });

  const handleRouteChange = (points: Point[], distance: number) => {
    setRouteData({ points, distance });
  };

  const handleDateTimeChange = (startDate: string, startTime: string) => {
    setDateTimeData({ startDate, startTime });
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleReset = () => {
    setCurrentStep(1);
    setRouteData({ points: [], distance: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <WizardSteps currentStep={currentStep} steps={WIZARD_STEPS} />

        <div className="max-w-5xl mx-auto">
          {currentStep === 1 && (
            <RouteStep
              onNext={handleNext}
              onRouteChange={handleRouteChange}
              routeData={routeData}
            />
          )}

          {currentStep === 2 && (
            <DateTimeStep
              onNext={handleNext}
              onBack={handleBack}
              onDateTimeChange={handleDateTimeChange}
              distance={routeData.distance}
              dateTimeData={dateTimeData}
            />
          )}

          {currentStep === 3 && (
            <AnalysisDashboard
              onBack={handleReset}
              routeData={routeData}
              dateTimeData={dateTimeData}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
