import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, User, Mail, Phone, Car, MapPin, FileText } from 'lucide-react';

interface Driver {
  id: number;
  email: string;
  name: string;
  phone: string;
  experience: string;
  vanType: string;
  location: string;
  licenseDocument: string;
  insuranceDocument: string;
  liabilityDocument: string;
  vehiclePhoto: string;
  isApproved: boolean | null;
  rating: number | null;
  completedJobs: number | null;
  createdAt: Date | null;
}

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      } else {
        setError('Failed to fetch drivers');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleDriverAction = async (driverId: number, action: 'approve' | 'decline') => {
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: action === 'approve' ? "Driver Approved" : "Driver Declined",
          description: `Driver ${data.driver.firstName} ${data.driver.lastName} has been ${action}d`,
          variant: "default",
        });

        // Refresh drivers list
        fetchDrivers();
      } else {
        const errorData = await response.json();
        toast({
          title: "Action Failed",
          description: errorData.message || `Failed to ${action} driver`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing driver:`, error);
      toast({
        title: "Connection Error",
        description: `Failed to ${action} driver. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (driver: Driver) => {
    if (!driver.isApproved && driver.isActive) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
    if (driver.isApproved && driver.isActive) {
      return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    }
    return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading drivers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
          <p className="text-gray-600 mt-2">Review and manage driver applications and approvals</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {drivers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
                <p className="text-gray-600 text-center">No driver applications have been submitted yet.</p>
              </CardContent>
            </Card>
          ) : (
            drivers.map((driver) => (
              <Card key={driver.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{driver.firstName} {driver.lastName}</CardTitle>
                        <CardDescription>Applied on {formatDate(driver.createdAt)}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(driver)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{driver.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{driver.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{driver.vehicleType}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{driver.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">License: {driver.licenseNumber}</span>
                    </div>
                  </div>

                  {!driver.isApproved && driver.isActive && (
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleDriverAction(driver.id, 'approve')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Driver
                      </Button>
                      <Button
                        onClick={() => handleDriverAction(driver.id, 'decline')}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {driver.isApproved && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-800 font-medium">Driver approved and active</span>
                      </div>
                    </div>
                  )}

                  {!driver.isActive && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm text-red-800 font-medium">Driver application declined</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}