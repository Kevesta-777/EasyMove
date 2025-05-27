import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, Truck, Share2, CheckCircle } from 'lucide-react';
import DriverPreview from '../components/booking/DriverPreview';
import RealTimeETA from '../components/booking/RealTimeETA';
import ChatInterface from '../components/booking/ChatInterface';
import DiscountOffer from '../components/booking/DiscountOffer';

export default function BookingTracker() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [driverStatus, setDriverStatus] = useState<'assigned' | 'en_route' | 'nearby' | 'arrived' | 'completed'>('assigned');
  const [showDiscount, setShowDiscount] = useState(false);

  // Dummy driver data for preview
  const driverData = {
    id: 'driver-123',
    name: 'Michael Johnson',
    rating: 4.8,
    completedJobs: 127,
    vehicleType: 'Medium Van',
    vehicleRegistration: 'LR22 TKE',
    phoneNumber: '07700 900123',
    verified: true,
    availableAt: '9:30 AM'
  };

  // Sample messages for chat preview
  const sampleMessages = [
    {
      id: '1',
      content: 'Hello, I\'m on my way to your location. Should be there in about 20 minutes.',
      sender: 'driver',
      timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
      read: true
    },
    {
      id: '2',
      content: 'Great, thanks for the update! Is there anything specific I should prepare before you arrive?',
      sender: 'user',
      timestamp: new Date(Date.now() - 38 * 60000).toISOString(),
      read: true
    },
    {
      id: '3',
      content: 'Just make sure all items are packed and ready to go. Also, if you have any fragile items, please point them out to me when I arrive.',
      sender: 'driver',
      timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
      read: true
    }
  ];

  useEffect(() => {
    // Load booking details from localStorage
    const loadBooking = () => {
      try {
        const savedBooking = localStorage.getItem('bookingDetails');
        
        if (savedBooking) {
          const booking = JSON.parse(savedBooking);
          setBookingDetails(booking);
        } else {
          // For demo purposes, create a dummy booking
          const dummyBooking = {
            id: 'EM-' + Math.floor(100000 + Math.random() * 900000),
            date: new Date().toISOString(),
            pickupAddress: '15 Oxford Street, London',
            deliveryAddress: '27 Kings Road, Brighton',
            distance: 53.4,
            price: 159.99,
            van: 'Medium',
            status: 'in_progress',
            driver: driverData
          };
          
          setBookingDetails(dummyBooking);
          
          // Save the dummy booking to localStorage
          localStorage.setItem('bookingDetails', JSON.stringify(dummyBooking));
        }
      } catch (error) {
        console.error('Error loading booking:', error);
        toast({
          title: "Error Loading Booking",
          description: "Could not load your booking details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBooking();

    // Simulated driver status updates for demo
    const statusTimer = setTimeout(() => {
      setDriverStatus('en_route');
      
      // After some time, update to 'nearby'
      setTimeout(() => {
        setDriverStatus('nearby');
        
        // After some more time, update to 'arrived'
        setTimeout(() => {
          setDriverStatus('arrived');
          
          // Show discount offer after job is completed
          setTimeout(() => {
            setShowDiscount(true);
          }, 5000);
        }, 15000);
      }, 20000);
    }, 10000);

    return () => clearTimeout(statusTimer);
  }, [toast]);

  const handleShareLocation = () => {
    toast({
      title: "Location Shared",
      description: "Your current location has been shared with the driver",
      variant: "default",
    });
  };

  const handleContactDriver = () => {
    // Switch to the chat tab
    document.getElementById('chat-tab')?.click();
  };

  const handleSendMessage = async (message: string) => {
    // Simulate sending a message
    console.log('Sending message:', message);
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  };

  const handleCallDriver = () => {
    // Simulate making a call
    toast({
      title: "Calling Driver",
      description: "Connecting your call...",
      variant: "default",
    });
  };

  const handleApplyDiscount = (code: string, amount: number) => {
    toast({
      title: "Discount Applied!",
      description: `You've received a ${amount}% discount for your next booking with code: ${code}`,
      variant: "default",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-lg">Loading your booking...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => setLocation('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Booking</h1>
        <p className="text-muted-foreground">
          Reference: {bookingDetails.id}
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>
                {new Date(bookingDetails.date).toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <div className="flex">
                    <MapPin className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <h3 className="font-medium text-sm">Pick-up</h3>
                      <p>{bookingDetails.pickupAddress}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex">
                    <MapPin className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <h3 className="font-medium text-sm">Delivery</h3>
                      <p>{bookingDetails.deliveryAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Distance</h3>
                  <p>{bookingDetails.distance} miles</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Van Size</h3>
                  <p>{bookingDetails.van}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Total Price</h3>
                  <p>£{bookingDetails.price.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
                  <div className="flex items-center mt-1">
                    <Truck className="h-4 w-4 text-primary mr-1" />
                    <span className="capitalize">{bookingDetails.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <DriverPreview
            driver={driverData}
            onRequestChange={() => {
              toast({
                title: "Request Sent",
                description: "Your request for a driver change has been submitted",
                variant: "default",
              });
            }}
            onChatWithDriver={handleContactDriver}
            onCallDriver={handleCallDriver}
          />
          
          <RealTimeETA
            bookingId={bookingDetails.id}
            driverName={driverData.name}
            driverLocation={{
              latitude: 51.5074,
              longitude: -0.1278,
              lastUpdated: new Date().toISOString()
            }}
            estimatedArrival={new Date(Date.now() + 30 * 60000).toISOString()}
            status={driverStatus}
            onShareLocation={handleShareLocation}
            onContactDriver={handleContactDriver}
          />
        </div>
        
        <div>
          <Tabs defaultValue="updates" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="updates">Live Updates</TabsTrigger>
              <TabsTrigger value="chat" id="chat-tab">Driver Chat</TabsTrigger>
            </TabsList>
            <TabsContent value="updates" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Booking Timeline</CardTitle>
                  <CardDescription>Live updates on your booking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="mr-3 flex flex-col items-center">
                        <div className="rounded-full w-8 h-8 bg-primary flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="h-full w-px bg-border mt-2"></div>
                      </div>
                      <div>
                        <h3 className="font-medium">Booking Confirmed</h3>
                        <p className="text-sm text-muted-foreground">
                          Your booking has been confirmed and a driver has been assigned.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(Date.now() - 60 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="mr-3 flex flex-col items-center">
                        <div className="rounded-full w-8 h-8 bg-muted flex items-center justify-center">
                          <Truck className="h-5 w-5 text-primary" />
                        </div>
                        <div className="h-full w-px bg-border mt-2"></div>
                      </div>
                      <div>
                        <h3 className="font-medium">Driver Assigned</h3>
                        <p className="text-sm text-muted-foreground">
                          Michael Johnson has been assigned to your booking.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(Date.now() - 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    {driverStatus === 'en_route' || driverStatus === 'nearby' || driverStatus === 'arrived' ? (
                      <div className="flex">
                        <div className="mr-3 flex flex-col items-center">
                          <div className={`rounded-full w-8 h-8 ${driverStatus === 'en_route' ? 'bg-primary/10' : 'bg-primary'} flex items-center justify-center`}>
                            <Share2 className={`h-5 w-5 ${driverStatus === 'en_route' ? 'text-primary' : 'text-primary-foreground'}`} />
                          </div>
                          <div className="h-full w-px bg-border mt-2"></div>
                        </div>
                        <div>
                          <h3 className="font-medium">Driver En Route</h3>
                          <p className="text-sm text-muted-foreground">
                            Your driver is on the way to the pickup location.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(Date.now() - 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ) : null}
                    
                    {driverStatus === 'nearby' || driverStatus === 'arrived' ? (
                      <div className="flex">
                        <div className="mr-3 flex flex-col items-center">
                          <div className={`rounded-full w-8 h-8 ${driverStatus === 'nearby' ? 'bg-orange-500/10' : 'bg-orange-500'} flex items-center justify-center`}>
                            <MapPin className={`h-5 w-5 ${driverStatus === 'nearby' ? 'text-orange-500' : 'text-primary-foreground'}`} />
                          </div>
                          <div className="h-full w-px bg-border mt-2"></div>
                        </div>
                        <div>
                          <h3 className="font-medium">Driver Nearby</h3>
                          <p className="text-sm text-muted-foreground">
                            Your driver is just a few minutes away.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(Date.now() - 5 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ) : null}
                    
                    {driverStatus === 'arrived' ? (
                      <div className="flex">
                        <div className="mr-3 flex flex-col items-center">
                          <div className="rounded-full w-8 h-8 bg-green-500 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-primary-foreground" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium">Driver Arrived</h3>
                          <p className="text-sm text-muted-foreground">
                            Your driver has arrived at the pickup location.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Need Help?</CardTitle>
                  <CardDescription>We're here to assist you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" variant="outline" onClick={handleContactDriver}>
                    Contact Driver
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => {
                    toast({
                      title: "Support Request Sent",
                      description: "Our customer service team will contact you shortly",
                      variant: "default",
                    });
                  }}>
                    Customer Support
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="chat">
              <ChatInterface
                bookingId={bookingDetails.id}
                driver={driverData}
                onSendMessage={handleSendMessage}
                onCall={handleCallDriver}
                initialMessages={sampleMessages}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {showDiscount && (
        <DiscountOffer
          previousBookingCount={1}
          onApply={handleApplyDiscount}
          onDismiss={() => setShowDiscount(false)}
        />
      )}
    </div>
  );
}