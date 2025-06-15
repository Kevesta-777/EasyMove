import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Eye, FileText, Clock, DollarSign, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchPayments } from "@/lib/api";
import { format } from "date-fns";
import { useLocation } from 'wouter';

interface Payment {
  id: number;
  bookingId: number;
  amount: number;
  status: string | null;
  paymentIntentId: string | null;
  customerName: string;
  customerEmail: string;
  createdAt: string;
}

export default function AdminPayments() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading payments",
        description: error instanceof Error ? error.message : "Failed to load payment data",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewingDetails(true);
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Tracking</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/admin/dashboard')}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Payment History</h2>
              <Button variant="outline">Export to CSV</Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.customerName}</TableCell>
                    <TableCell>£{payment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(payment.status)}`}>
                        {payment.status || 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell>{payment.paymentIntentId || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      {isViewingDetails && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>
                Payment Details #{selectedPayment.id}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p>Name: {selectedPayment.customerName}</p>
                  <p>Email: {selectedPayment.customerEmail}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Payment Details</h3>
                  <p>Amount: £{selectedPayment.amount.toFixed(2)}</p>
                  <p>Method: {selectedPayment.method}</p>
                  <p>Status: {selectedPayment.status}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Timeline</h3>
                  <p>Created: {format(new Date(selectedPayment.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                  <p>Updated: {format(new Date(selectedPayment.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Booking Status</h3>
                  <p>Status: {selectedPayment.bookingStatus}</p>
                  <Button variant="outline" className="mt-4">
                    <FileText className="mr-2 h-4 w-4" />
                    View Booking Details
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsViewingDetails(false)}
              >
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
