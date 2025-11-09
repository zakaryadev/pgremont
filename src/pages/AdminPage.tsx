import React from 'react';
import { UserManagement } from '../components/admin/UserManagement';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PendingPayments } from '../components/admin/PendingPayments';

export default function AdminPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

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

        <div className="mt-6">
          <PendingPayments />
        </div>
      </div>
    </div>
  );
}
