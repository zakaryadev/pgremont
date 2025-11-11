import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';

// Predefined users for selection
const USERS = [
  {
    name: 'PG Remont',
    password: 'pgremont0800',
    role: 'admin'
  },
  {
    name: 'Manager',
    password: 'pgremont0000',
    role: 'manager'
  }
];

export function LoginForm() {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast({
        title: "Xatolik",
        description: "Foydalanuvchi turini tanlang",
        variant: "destructive",
      });
      return;
    }

    if (!password) {
      toast({
        title: "Xatolik",
        description: "Parolni kiriting",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Sign in with the selected user and entered password
    const { error } = await signIn(selectedUser, password);
    
    if (error) {
      toast({
        title: "Xatolik",
        description: "Parol noto'g'ri",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Muvaffaqiyat",
        description: `${selectedUser} sifatida tizimga kirdingiz`,
      });
    }
    
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Tizimga kirish</CardTitle>
        <CardDescription className="text-center">
          Foydalanuvchi turini tanlang va parolni kiriting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">Foydalanuvchi turi</Label>
            {USERS.map((user) => (
              <Button
                key={user.name}
                type="button"
                variant={selectedUser === user.name ? "default" : "outline"}
                className="w-full h-16 text-lg font-medium"
                onClick={() => setSelectedUser(user.name)}
                disabled={loading}
              >
                <div className="flex flex-col items-center">
                  <span>{user.name}</span>
                  <span className="text-sm opacity-70">
                    {user.role === 'admin' ? 'Administrator' : 'Manager'}
                  </span>
                </div>
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Parol</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parolingizni kiriting"
              required
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading || !selectedUser}>
            {loading ? "Kiring..." : "Kirish"}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Faqat tizimda ro'yxatdan o'tgan foydalanuvchilar kirish mumkin
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
