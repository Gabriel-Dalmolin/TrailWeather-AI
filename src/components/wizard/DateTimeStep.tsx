import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Calendar, Clock } from "lucide-react";

interface DateTimeStepProps {
  onNext: () => void;
  onBack: () => void;
  onDateTimeChange: (startDate: string, startTime: string) => void;
  distance: number;
  dateTimeData: {
    startDate: string;
    startTime: string;
  };
}

const DateTimeStep = ({ onNext, onBack, onDateTimeChange, distance, dateTimeData }: DateTimeStepProps) => {
  const [startDate, setStartDate] = useState(dateTimeData.startDate);
  const [startTime, setStartTime] = useState(dateTimeData.startTime);

  // Calculate estimated duration based on average hiking speed (4.5 km/h)
  const avgSpeed = 4.5;
  const estimatedHours = distance / avgSpeed;
  const hours = Math.floor(estimatedHours);
  const minutes = Math.round((estimatedHours - hours) * 60);

  const handleContinue = () => {
    onDateTimeChange(startDate, startTime);
    onNext();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Set trail schedule</CardTitle>
          </div>
          <CardDescription>
            Choose the start date and time to get accurate weather analysis for your route.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {distance > 0 && (
            <div className="p-4 bg-gradient-primary rounded-lg text-primary-foreground">
              <p className="text-sm font-medium mb-2">Estimated Duration</p>
              <p className="text-3xl font-bold">
                {hours}h {minutes}min
              </p>
              <p className="text-xs mt-2 opacity-90">
                Based on average speed of {avgSpeed} km/h and distance of {distance.toFixed(2)} km
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!startDate || !startTime}
              className="flex-1"
              size="lg"
            >
              Analyze Route
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DateTimeStep;
