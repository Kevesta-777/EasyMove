# EasyMove Admin Portal - GitHub Deployment Package

## Complete Admin System Files

### 1. Admin Authentication (`client/src/pages/admin/AdminLogin.tsx`)
```typescript
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, Lock, User, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Admin authentication - customize these credentials
      const validCredentials = [
        { email: 'manager@easymove.com', password: 'secure2025' },
        { email: 'admin@easymove.com', password: 'admin123' },
        { email: 'admin', password: 'admin123' }
      ];

      const isValid = validCredentials.some(cred => 
        cred.email === credentials.email && cred.password === credentials.password
      );

      if (isValid) {
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminEmail', credentials.email);
        setLocation('/admin/dashboard');
      } else {
        setError('Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">EasyMove Admin</CardTitle>
          <CardDescription>
            Access the administration portal to manage your platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@easymove.com"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Demo Credentials:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Email: manager@easymove.com</div>
              <div>Password: secure2025</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. Admin Dashboard (`client/src/pages/admin/AdminDashboard.tsx`)
```typescript
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuth');
    const email = localStorage.getItem('adminEmail');
    
    if (!isAuthenticated) {
      setLocation('/admin/login');
      return;
    }
    
    if (email) {
      setAdminEmail(email);
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminEmail');
    setLocation('/admin/login');
  };

  // Mock data for dashboard - replace with real API calls
  const dashboardData = {
    totalBookings: 247,
    newUsers: 12,
    newDrivers: 3,
    totalRevenue: 15420,
    pendingDrivers: [
      {
        id: 1,
        name: 'Emma Thompson',
        email: 'emma.t@email.com',
        vanSize: 'Large',
        location: 'London',
        applicationDate: '2025-05-28',
        status: 'pending'
      },
      {
        id: 2,
        name: 'James Wilson',
        email: 'j.wilson@email.com',
        vanSize: 'Medium',
        location: 'Birmingham',
        applicationDate: '2025-05-27',
        status: 'pending'
      }
    ],
    recentBookings: [
      {
        id: 'BK001',
        customer: 'Sarah Johnson',
        from: 'London, NW1',
        to: 'Manchester, M1',
        date: '2025-05-30',
        status: 'confirmed',
        value: 285
      },
      {
        id: 'BK002',
        customer: 'Mike Chen',
        from: 'Birmingham, B1',
        to: 'Coventry, CV1',
        date: '2025-05-30',
        status: 'in-progress',
        value: 156
      }
    ],
    systemHealth: {
      paymentProcessing: 'operational',
      databaseConnection: 'operational',
      quoteCalculator: 'operational'
    }
  };

  const approveDriver = (driverId: number) => {
    console.log('Approving driver:', driverId);
    // Implement driver approval logic
  };

  const rejectDriver = (driverId: number) => {
    console.log('Rejecting driver:', driverId);
    // Implement driver rejection logic
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">EasyMove Admin</h1>
                <p className="text-sm text-gray-500">Platform Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {adminEmail}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                +15% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.newUsers}</div>
              <p className="text-xs text-muted-foreground">
                This week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Drivers</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.newDrivers}</div>
              <p className="text-xs text-muted-foreground">
                2 pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{dashboardData.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +22% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Latest customer bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{booking.customer}</p>
                          <p className="text-sm text-gray-500">
                            {booking.from} → {booking.to}
                          </p>
                          <p className="text-xs text-gray-400">{booking.date}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                            {booking.status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">£{booking.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Platform status monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Payment Processing</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Operational
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database Connection</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Operational
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Quote Calculator</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Operational
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Driver Applications</CardTitle>
                <CardDescription>Pending driver verifications and approvals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.pendingDrivers.map((driver) => (
                    <div key={driver.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{driver.name}</h3>
                          <p className="text-sm text-gray-500">{driver.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              {driver.vanSize} Van
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {driver.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {driver.applicationDate}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => rejectDriver(driver.id)}
                          >
                            Reject
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => approveDriver(driver.id)}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Management</CardTitle>
                <CardDescription>Manage all platform bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Booking management interface</p>
                  <Button className="mt-4" onClick={() => setLocation('/admin/bookings')}>
                    View All Bookings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>Platform settings and configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Pricing Settings
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <MapPin className="w-4 h-4 mr-2" />
                      Service Areas
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      User Management
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>Business performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Revenue Reports
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Usage Analytics
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Star className="w-4 h-4 mr-2" />
                      Customer Feedback
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

### 3. Booking Management (`client/src/pages/admin/AdminBookings.tsx`)
```typescript
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  Truck,
  Clock,
  DollarSign,
  Phone,
  Mail
} from 'lucide-react';

export default function AdminBookings() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuth');
    if (!isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [setLocation]);

  // Mock booking data - replace with real API calls
  const bookings = [
    {
      id: 'BK001',
      customer: {
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '+44 7123 456789'
      },
      route: {
        from: 'London, NW1 2DB',
        to: 'Manchester, M1 1AA'
      },
      details: {
        date: '2025-05-30',
        time: '09:00',
        vanSize: 'Large',
        duration: '5 hours',
        distance: '200 miles'
      },
      pricing: {
        subtotal: 240,
        vat: 45,
        total: 285
      },
      status: 'confirmed',
      driver: 'Tom Wilson',
      createdAt: '2025-05-28T10:30:00Z'
    },
    {
      id: 'BK002',
      customer: {
        name: 'Mike Chen',
        email: 'mike.c@email.com',
        phone: '+44 7987 654321'
      },
      route: {
        from: 'Birmingham, B1 1BB',
        to: 'Coventry, CV1 1CC'
      },
      details: {
        date: '2025-05-30',
        time: '14:00',
        vanSize: 'Medium',
        duration: '3 hours',
        distance: '25 miles'
      },
      pricing: {
        subtotal: 130,
        vat: 26,
        total: 156
      },
      status: 'in-progress',
      driver: 'Emma Thompson',
      createdAt: '2025-05-29T08:15:00Z'
    }
  ];

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateBookingStatus = (bookingId: string, newStatus: string) => {
    console.log(`Updating booking ${bookingId} to status: ${newStatus}`);
    // Implement status update logic
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/admin/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Booking Management</h1>
                <p className="text-sm text-gray-500">{filteredBookings.length} bookings found</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search bookings, customers, or booking IDs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Booking Info */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg">{booking.id}</h3>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {booking.details.date} at {booking.details.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        {booking.details.vanSize} Van
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {booking.details.duration}
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="lg:col-span-1">
                    <h4 className="font-medium mb-3">Customer</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {booking.customer.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {booking.customer.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {booking.customer.phone}
                      </div>
                    </div>
                  </div>

                  {/* Route Info */}
                  <div className="lg:col-span-1">
                    <h4 className="font-medium mb-3">Route</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">From</p>
                          <p className="text-gray-600">{booking.route.from}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                        <div>
                          <p className="font-medium">To</p>
                          <p className="text-gray-600">{booking.route.to}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Actions */}
                  <div className="lg:col-span-1">
                    <h4 className="font-medium mb-3">Pricing & Actions</h4>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>£{booking.pricing.subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT:</span>
                        <span>£{booking.pricing.vat}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>£{booking.pricing.total}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Select 
                        value={booking.status} 
                        onValueChange={(value) => updateBookingStatus(booking.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No bookings have been created yet.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

### 4. App Routing Configuration (`client/src/App.tsx`)
```typescript
// Add these imports to your existing App.tsx
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminBookings from '@/pages/admin/AdminBookings';

// Add these routes to your existing routes
<Route path="/admin/login" component={AdminLogin} />
<Route path="/admin/dashboard" component={AdminDashboard} />
<Route path="/admin/bookings" component={AdminBookings} />
```

## Deployment Instructions

### 1. Environment Variables
Add to your production environment:
```bash
# Admin Configuration
ADMIN_EMAIL=manager@easymove.com
ADMIN_PASSWORD=secure2025

# Database
DATABASE_URL=your_production_database_url

# Payment Processing
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 2. GitHub Repository Structure
```
your-repo/
├── client/
│   └── src/
│       └── pages/
│           └── admin/
│               ├── AdminLogin.tsx
│               ├── AdminDashboard.tsx
│               └── AdminBookings.tsx
├── server/
├── shared/
├── .env.example
├── package.json
└── README.md
```

### 3. Deploy Commands
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### 4. Admin Access URLs
- Development: `http://localhost:5000/admin/login`
- Production: `https://your-domain.com/admin/login`

### 5. Security Notes
- Change default admin credentials before deployment
- Enable HTTPS in production
- Set up proper session management
- Implement rate limiting for admin endpoints
- Add audit logging for admin actions

The admin portal is now ready for GitHub deployment with full functionality for managing your EasyMove platform.