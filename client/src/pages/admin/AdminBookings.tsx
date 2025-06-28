import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, Filter, Download, Eye, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: number;
  status: string;
  moveDate: string;
  vanSize: string;
  price: number;
  distance: number;
  collectionAddress: string;
  deliveryAddress: string;
  createdAt: string;
  customer?: {
    id: number;
    username: string;
    email: string;
  };
  driver?: {
    id: number;
    name: string;
    phone: string;
  };
}

export default function AdminBookings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['/api/admin/bookings', searchTerm, statusFilter],
    queryFn: async ({ queryKey }) => {
      const [_path, _searchTerm, _statusFilter] = queryKey;
      const params = new URLSearchParams({
        searchTerm: _searchTerm,
        status: _statusFilter
      });
      const response = await apiRequest({
        method: 'GET',
        url: `/api/admin/bookings?${params.toString()}`
      });
      return response;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      try {
        const response = await apiRequest({
          method: 'POST',
          url: `/api/admin/booking/${id}/update`,
          data: { status }
        });
        if (!response?.success) {
          throw new Error('Failed to update booking');
        }
        return response.booking;
      } catch (error) {
        console.error('Error updating booking:', error);
        throw error;
      }
    },
    onSuccess: (updatedBooking) => {
      toast({
        title: "Booking Updated",
        description: "Booking status has been updated successfully",
      });
      
      // Update the specific booking in the cache immediately
      queryClient.setQueryData(['/api/admin/bookings'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((booking: any) => 
          booking.id === updatedBooking.id ? updatedBooking : booking
        );
      });
      
      // Invalidate the query to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings', searchTerm, statusFilter] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (bookingId: number, newStatus: string) => {
    updateBookingMutation.mutate({ id: bookingId, status: newStatus });
  };

  const formatPrice = (price: number) => {
    return `£${price.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'outline';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/admin/dashboard')}
                className="flex items-center justify-center mr-10 rounded-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Booking Management</h1>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search bookings by customer, address, or booking ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Van Size</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Driver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        </TableCell>
                      </TableRow>
                    ) : bookings?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                          No bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      bookings.map((booking: Booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">#{booking.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.customer?.username || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{booking.customer?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm font-medium truncate">{booking.collectionAddress}</p>
                              <p className="text-sm text-gray-500 truncate">→ {booking.deliveryAddress}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(booking.moveDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{booking.vanSize}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(booking.price)}
                          </TableCell>
                          <TableCell>{booking.distance} miles</TableCell>
                          <TableCell>
                            <Select 
                              value={booking.status} 
                              onValueChange={(value) => handleStatusUpdate(booking.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <Badge variant={getStatusColor(booking.status)}>
                                  {booking.status}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {booking.driver ? (
                              <div>
                                <p className="font-medium">{booking.driver.name}</p>
                                <p className="text-sm text-gray-500">{booking.driver.phone}</p>
                              </div>
                            ) : (
                              <Badge variant="secondary">Unassigned</Badge>
                            )}
                          </TableCell>

                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}