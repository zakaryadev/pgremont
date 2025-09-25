import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AuthModal } from './auth/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

interface NavigationProps {
  activeCalculator: string;
  onCalculatorChange: (calculator: string) => void;
}

export function Navigation({ activeCalculator, onCalculatorChange }: NavigationProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, signOut } = useAuth();
  const calculators = [
    {
      id: 'polygraphy',
      name: 'Poligrafiya',
      description: 'Banner, orakal, holst va boshqa bosma ishlar',
      icon: '🖨️'
    },
    {
      id: 'tablets',
      name: 'Tablichkalar',
      description: 'Romark, orgsteklo, akril tablichkalar, beydjik, statuetka va boltlar',
      icon: '📋'
    },
      {
        id: 'letters',
        name: 'Bukvalar',
        description: 'Korob va harflar',
        icon: '🔤'
      }
  ];


  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <div className="flex flex-col items-center mb-4">
          <img 
            src="/logo.png" 
            alt="TOGO GROUP Logo" 
            className="h-16 md:h-20 w-auto mb-4"
          />
        </div>
        {/* Auth Section */}
        <div className="flex justify-center mb-4">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user.email === 'admin@togogroup.com' ? 'Admin' : user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Chiqish
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Tizimga kirish
            </Button>
          )}
        </div>
      </div>
      
      {/* Categories */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-center">Yo'nalish turlarini tanlang:</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {calculators.map((calculator) => (
            <Card 
              key={calculator.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                activeCalculator === calculator.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onCalculatorChange(calculator.id)}
            >
              <CardHeader className="text-center pb-2">
                <div className="text-4xl mb-2">{calculator.icon}</div>
                <CardTitle className="text-lg">{calculator.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground text-center">
                  {calculator.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}
