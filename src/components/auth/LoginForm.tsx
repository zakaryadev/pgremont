import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check for default admin credentials
    if (username === 'TogoGroupPRO' && password === 'togo0800') {
      // For default admin, use admin@togogroup.com email
      const { error } = await signIn('admin@togogroup.com', 'togo0800');
      
      if (error) {
        toast({
          title: "Xatolik",
          description: "Login yoki parol noto'g'ri",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Muvaffaqiyat",
          description: "Admin sifatida tizimga kirdingiz",
        });
      }
    } else {
      // For other users, try with username as email
      const { error } = await signIn(username, password);
      
      if (error) {
        toast({
          title: "Xatolik",
          description: "Login yoki parol noto'g'ri",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Muvaffaqiyat",
          description: "Tizimga muvaffaqiyatli kirdingiz",
        });
      }
    }
    
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Kirish</CardTitle>
        <CardDescription>
          Tizimga kirish uchun login va parolingizni kiriting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Login</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Login kiriting"
              required
            />
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
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Kiring..." : "Kirish"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Faqat admin tomonidan berilgan login va parol bilan kirish mumkin
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
