import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, Clock, Mail, Phone, Car, MapPin, FileText, User, XCircle, Check, X, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from '@/hooks/use-toast';


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
  approvalStatus: 'pending' | 'approved' | 'declined';
  rating: number | null;
  completedJobs: number | null;
  createdAt: Date | null;
}

export default function AdminDrivers() {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState('');
  const { toast } = useToast();


  useEffect(() => {
    console.log('Component mounted - fetching drivers');
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      console.log('Fetching drivers from API...');
      const response = await fetch('/api/admin/pending-drivers', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('API Response Status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error Response:', errorData);
        setError(`Failed to fetch drivers: ${errorData?.message || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      console.log('Received data from API:', data);
      
      // Verify the data structure
      if (!Array.isArray(data)) {
        console.error('Invalid data format received:', data);
        setError('Invalid data format received from server');
        return;
      }

      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const updateApprovalStatus = async (id: number, status: 'approved' | 'declined') => {
    try {
      const response = await fetch(`/api/admin/drivers/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `Driver status updated to ${status}`,
        });
        fetchDrivers();
      } else {
        setError(`Failed to update driver status to ${status}`);
      }
    } catch (error) {
      console.error('Error updating driver status:', error);
      setError('Failed to connect to server');
    }
  };

  const getStatusBadge = (driver: Driver) => {
    switch (driver.approvalStatus) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'declined':
        return <Badge variant="outline" className="text-red-600 border-red-600"><X className="w-3 h-3 mr-1" />Declined</Badge>;
    }
  };

  const formatDate = (dateValue: string | Date | null) => {
    if (!dateValue) return 'Unknown';
    const date = typeof dateValue === 'string' 
      ? new Date(dateValue.replace(' ', 'T')) // Handle space-separated timestamps
      : dateValue;
    
    return date.toLocaleDateString('en-GB', {
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
        <div className="container mx-auto py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Driver Management</h1>
            <a
              href="/admin/dashboard"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </a>
          </div>
          <p className="text-gray-600 mt-2">Review and manage driver applications and approvals</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : drivers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
                <p className="text-gray-600 text-center">No driver applications have been submitted yet.</p>
              </CardContent>
            </Card>
          ) : Array.isArray(drivers) ? (
            drivers.map((driver) => (
              <Card key={driver.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{driver.name}</CardTitle>
                        <CardDescription>Applied on {formatDate(driver.createdAt)}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(driver)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Email</span>
                      <span className="text-gray-900">{driver.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Phone</span>
                      <span className="text-gray-900">{driver.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Experience</span>
                      <span className="text-gray-900">{driver.experience}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Van Type</span>
                      <span className="text-gray-900">{driver.vanType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Location</span>
                      <span className="text-gray-900">{driver.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Rating</span>
                      <span className="text-gray-900">{driver.rating || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Completed Jobs</span>
                      <span className="text-gray-900">{driver.completedJobs || 0}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex justify-end space-x-2">
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateApprovalStatus(driver.id, 'approved')}
                        disabled={driver.approvalStatus === 'approved'}
                        className="mr-2"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {driver.approvalStatus === 'approved' ? 'Approved' : 'Approve'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => updateApprovalStatus(driver.id, 'declined')}
                        disabled={driver.approvalStatus === 'declined'}
                      >
                        <X className="w-4 h-4 mr-2" />
                        {driver.approvalStatus === 'declined' ? 'Declined' : 'Decline'}
                      </Button>
                    </>
                    {driver.approvalStatus === 'declined' && (
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm text-red-800 font-medium">Driver application declined</span>
                      </div>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
                <p className="text-gray-600 text-center">No driver applications have been submitted yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}