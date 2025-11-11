import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";

const Index = () => {
  const navigate = useNavigate();

  const handleCalculatorChange = (calculator: string) => {
    navigate('/other-services');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Navigation 
          activeCalculator=""
          onCalculatorChange={handleCalculatorChange}
        />
      </div>
    </div>
  );
};

export default Index;
