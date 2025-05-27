import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Truck, Navigation, AlertCircle, CheckCircle, Share2 } from 'lucide-react';

interface RealTimeETAProps {
  bookingId?: string;
  driverName?: string;
  driverLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
  estimatedArrival?: string;
  status?: 'assigned' | 'en_route' | 'nearby' | 'arrived' | 'completed';
  onShareLocation?: () => void;
  onContactDriver?: () => void;
}

export default function RealTimeETA({
  bookingId,
  driverName = 'Your driver',
  driverLocation,
  estimatedArrival,
  status = 'assigned',
  onShareLocation,
  onContactDriver,
}: RealTimeETAProps) {
  const [progress, setProgress] = useState(0);
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [notifications, setNotifications] = useState<{ id: string; message: string; time: string }[]>([]);

  // Update status message based on current status
  useEffect(() => {
    switch (status) {
      case 'assigned':
        setStatusMessage(`${driverName} has been assigned to your move`);
        setProgress(10);
        break;
      case 'en_route':
        setStatusMessage(`${driverName} is on the way to your location`);
        setProgress(40);
        break;
      case 'nearby':
        setStatusMessage(`${driverName} is nearby and will arrive shortly`);
        setProgress(70);
        break;
      case 'arrived':
        setStatusMessage(`${driverName} has arrived at your location`);
        setProgress(100);
        break;
      case 'completed':
        setStatusMessage(`Your move with ${driverName} has been completed`);
        setProgress(100);
        break;
      default:
        setStatusMessage('Waiting for driver assignment');
        setProgress(0);
    }
  }, [status, driverName]);

  // Calculate remaining minutes from the estimated arrival time
  useEffect(() => {
    if (estimatedArrival && (status === 'en_route' || status === 'nearby')) {
      try {
        const arrivalTime = new Date(estimatedArrival).getTime();
        const currentTime = new Date().getTime();
        const diffMinutes = Math.round((arrivalTime - currentTime) / (1000 * 60));
        setRemainingMinutes(diffMinutes > 0 ? diffMinutes : 0);
      } catch (error) {
        console.error('Error calculating remaining time:', error);
        setRemainingMinutes(null);
      }
    } else {
      setRemainingMinutes(null);
    }
  }, [estimatedArrival, status]);

  // Simulate adding notifications for demo purposes
  useEffect(() => {
    if (status === 'en_route') {
      const newNotification = {
        id: Date.now().toString(),
        message: `${driverName} is on the way to your location. Estimated arrival in ${remainingMinutes} minutes.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setNotifications(prev => [newNotification, ...prev]);
    } else if (status === 'nearby') {
      const newNotification = {
        id: Date.now().toString(),
        message: `${driverName} is approximately ${remainingMinutes} minutes away.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setNotifications(prev => [newNotification, ...prev]);
    } else if (status === 'arrived') {
      const newNotification = {
        id: Date.now().toString(),
        message: `${driverName} has arrived at your location.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setNotifications(prev => [newNotification, ...prev]);
    }
  }, [status, driverName, remainingMinutes]);

  // Get the appropriate icon for the current status
  const getStatusIcon = () => {
    switch (status) {
      case 'assigned':
        return <Truck className="h-5 w-5 text-primary" />;
      case 'en_route':
        return <Navigation className="h-5 w-5 text-primary animate-pulse" />;
      case 'nearby':
        return <MapPin className="h-5 w-5 text-orange-500 animate-pulse" />;
      case 'arrived':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Get the appropriate badge for the current status
  const getStatusBadge = () => {
    switch (status) {
      case 'assigned':
        return <Badge variant="outline">Assigned</Badge>;
      case 'en_route':
        return <Badge variant="default" className="bg-primary">En Route</Badge>;
      case 'nearby':
        return <Badge variant="default" className="bg-orange-500">Nearby</Badge>;
      case 'arrived':
        return <Badge variant="default" className="bg-green-500">Arrived</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      default:
        return <Badge variant="outline">Waiting</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Driver Status</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>Real-time updates on your move</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          {getStatusIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium">{statusMessage}</p>
            {remainingMinutes !== null && status !== 'arrived' && status !== 'completed' && (
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>ETA: {remainingMinutes} minutes</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Assigned</span>
            <span>En Route</span>
            <span>Arrived</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {notifications.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <h4 className="text-sm font-medium mb-2">Recent Updates</h4>
            <div className="space-y-2 max-h-[120px] overflow-y-auto">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="bg-muted/50 rounded-md p-2 text-xs"
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Status Update</span>
                    <span className="text-muted-foreground">{notification.time}</span>
                  </div>
                  <p>{notification.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {onShareLocation && (
            <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={onShareLocation}>
              <Share2 className="h-4 w-4" /> Share My Location
            </Button>
          )}
          {onContactDriver && (
            <Button variant="default" size="sm" className="flex-1" onClick={onContactDriver}>
              Contact Driver
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}