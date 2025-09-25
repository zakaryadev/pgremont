import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';

export function UserManagement() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <p className="text-muted-foreground">
          Tizim boshqaruvi va ma'lumotlar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Ma'lumotlari</CardTitle>
            <CardDescription>
              Joriy admin foydalanuvchi haqida ma'lumot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Rol:</strong> Admin</p>
              <p><strong>Kirish vaqti:</strong> {new Date().toLocaleString('uz-UZ')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tizim Ma'lumotlari</CardTitle>
            <CardDescription>
              Kalkulyator tizimi haqida ma'lumot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Versiya:</strong> 1.0.0</p>
              <p><strong>Kalkulyatorlar:</strong> 3 ta</p>
              <p><strong>Holat:</strong> Faol</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kalkulyatorlar</CardTitle>
          <CardDescription>
            Mavjud kalkulyator turlari
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🖨️ Poligrafiya</h3>
              <p className="text-sm text-muted-foreground">
                Banner, orakal, holst va boshqa bosma ishlar
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">📋 Tablichkalar</h3>
              <p className="text-sm text-muted-foreground">
                Romark, orgsteklo, akril tablichkalar
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🔤 Bukvalar</h3>
              <p className="text-sm text-muted-foreground">
                O'lchamli harflar, yorug'lik korobi
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
