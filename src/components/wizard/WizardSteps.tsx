import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Fragment } from "react";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface WizardStepsProps {
  currentStep: number;
  steps: Step[];
}

const WizardSteps = ({ currentStep, steps }: WizardStepsProps) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <Fragment key={step.id}>
            <div className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300",
                    currentStep > step.id
                      ? "bg-success text-success-foreground shadow-md"
                      : currentStep === step.id
                        ? "bg-primary text-primary-foreground shadow-lg scale-110"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      currentStep >= step.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 -mt-12">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    currentStep > step.id
                      ? "bg-success"
                      : "bg-border"
                  )}
                />
              </div>
            )}

          </Fragment>

        ))}
      </div>
    </div>
  );
};

export default WizardSteps;
