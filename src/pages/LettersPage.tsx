import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LettersCalculator } from "@/components/calculator/LettersCalculator";

const LettersPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            ← Asosiy sahifaga qaytish
          </Button>
        </div>
        <LettersCalculator />
      </div>
    </div>
  );
};

export default LettersPage;
