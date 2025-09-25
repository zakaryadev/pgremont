import React, { useState, useEffect } from 'react';
import { UserManagement } from '../components/admin/UserManagement';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

export default function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        setIsAdmin(user.email === 'admin@togogroup.com');
      } else {
        setIsAdmin(profile?.role === 'admin');
      }
    } catch (error) {
      setIsAdmin(user.email === 'admin@togogroup.com');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold mb-4">Ruxsat yo'q</h1>
              <p className="text-muted-foreground mb-4">
                Bu sahifaga faqat admin kirish mumkin
              </p>
              <Link to="/">
                <button className="inline-flex items-center gap-2 text-primary hover:underline">
                  <ArrowLeft className="h-4 w-4" />
                  Bosh sahifaga qaytish
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Bosh sahifaga qaytish
          </Link>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">
            Tizim boshqaruvi va foydalanuvchilar
          </p>
        </div>

        <UserManagement />
      </div>
    </div>
  );
}
