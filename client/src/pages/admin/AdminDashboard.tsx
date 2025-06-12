import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Truck, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  LogOut,
  Settings,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  totalBookings: number;
  newUsers: number;
  newDrivers: number;
  totalRevenue: number;
  pendingDrivers: number;
  activeComplaints: number;
  todayBookings: number;
  thisWeekBookings: number;
  thisMonthBookings: number;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adminAuth, setAdminAuth] = useState<any>(null);

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (!auth) {
      setLocation('/admin/login');
      return;
    }
    
    try {
      const parsedAuth = JSON.parse(auth);
      setAdminAuth(parsedAuth);
    } catch (error) {
      console.error('Invalid admin auth:', error);
      setLocation('/admin/login');
    }
  }, [setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest({
        method: 'GET',
        url: '/api/admin/stats'
      });
      return response;
    },
    enabled: !!adminAuth,
  });

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/admin/recent-bookings'],
    queryFn: async () => {
      const response = await apiRequest({
        method: 'GET',
        url: '/api/admin/recent-bookings'
      });
      return response;
    },
    enabled: !!adminAuth,
  });

  const { data: pendingDrivers, isLoading: driversLoading } = useQuery({
    queryKey: ['/api/admin/pending-drivers'],
    queryFn: async () => {
      const response = await apiRequest({
        method: 'GET',
        url: '/api/admin/pending-drivers'
      });
      return response;
    },
    enabled: !!adminAuth,
  });

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    toast({
      title: "Logged Out",
      description: "Successfully logged out of admin portal",
    });
    setLocation('/admin/login');
  };

  const navigateTo = (path: string) => {
    setLocation(path);
  };

  if (!adminAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <Badge variant="secondary" className="ml-3">
                {adminAuth?.role || 'Admin'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {adminAuth?.user?.username || 'Admin'}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : stats?.totalBookings || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : stats?.newUsers || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Truck className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Drivers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : stats?.newDrivers || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    £{statsLoading ? '...' : (stats?.totalRevenue || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigateTo('/admin/bookings')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Manage Bookings
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigateTo('/admin/drivers')}
              >
                <Truck className="mr-2 h-4 w-4" />
                Driver Verification
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigateTo('/admin/users')}
              >
                <Users className="mr-2 h-4 w-4" />
                User Management
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigateTo('/admin/payments')}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Payment Tracking
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Actions</CardTitle>
              <CardDescription>Items requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium">Pending Driver Approvals</span>
                </div>
                <Badge variant="secondary">
                  {driversLoading ? '...' : pendingDrivers?.length || 0}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium">Active Complaints</span>
                </div>
                <Badge variant="secondary">
                  {statsLoading ? '...' : stats?.activeComplaints || 0}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium">Today's Bookings</span>
                </div>
                <Badge variant="secondary">
                  {statsLoading ? '...' : stats?.todayBookings || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest booking activity</CardDescription>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(recentBookings) && recentBookings.length > 0 ? (
                    recentBookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Booking #{booking.id}</p>
                          <p className="text-sm text-gray-600">
                            {booking.collectionAddress} → {booking.deliveryAddress}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            booking.status === 'completed' ? 'default' :
                            booking.status === 'pending' ? 'secondary' :
                            booking.status === 'in_progress' ? 'outline' : 'destructive'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No recent bookings</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Platform performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payment Processing</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Operational</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quote Calculator</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Driver Notifications</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}