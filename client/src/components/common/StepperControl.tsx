
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Users,
  ShoppingCart,
  ReceiptText,
  CreditCard,
  Printer
} from 'lucide-react';

interface StepperControlProps {
  currentStep: number;
  steps: string[];
  onNext: () => void;
  onPrev: () => void;
  canProgress: boolean;
}

export default function StepperControl({ 
  currentStep, 
  steps, 
  onNext, 
  onPrev,
  canProgress
}: StepperControlProps) {
  const stepsRef = useRef<HTMLDivElement>(null);
  
  // Scroll active step into view when step changes
  useEffect(() => {
    if (stepsRef.current) {
      const activeStep = stepsRef.current.querySelector('[data-active="true"]');
      if (activeStep) {
        activeStep.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentStep]);
  
  // Get icon for step
  const getStepIcon = (index: number) => {
    switch(index) {
      case 0: return <Users className="h-5 w-5" />;
      case 1: return <ShoppingCart className="h-5 w-5" />;
      case 2: return <ReceiptText className="h-5 w-5" />;
      case 3: return <CreditCard className="h-5 w-5" />;
      case 4: return <Printer className="h-5 w-5" />;
      default: return <Check className="h-5 w-5" />;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="relative w-full overflow-auto px-2 sm:px-4 py-2" ref={stepsRef}>
        <div className="flex items-center">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="flex flex-1 items-center"
              data-active={currentStep === index}
            >
              <div 
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  index <= currentStep 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {getStepIcon(index)}
              </div>
              
              <div className="ml-3 mr-auto">
                <p 
                  className={`text-sm font-medium transition-colors ${
                    index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div 
                  className={`flex-1 h-px mx-2 sm:mx-3 transition-colors ${
                    index < currentStep ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={currentStep === 0}
          className="gap-2 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Précédent
        </Button>
        
        <Button
          onClick={onNext}
          disabled={currentStep === steps.length - 1 || !canProgress}
          className="gap-2 transition-all"
        >
          {currentStep === steps.length - 1 ? (
            <>
              Terminer
              <Check className="h-4 w-4" />
            </>
          ) : (
            <>
              Suivant
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
