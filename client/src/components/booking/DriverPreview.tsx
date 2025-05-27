import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MessageCircle, ThumbsUp, Shield, CarFront, Phone } from 'lucide-react';

interface DriverPreviewProps {
  driver?: {
    id: string;
    name: string;
    rating: number;
    completedJobs: number;
    vehicleType: string;
    vehicleRegistration?: string;
    phoneNumber?: string;
    profileImage?: string;
    verified: boolean;
    availableAt?: string;
  };
  onRequestChange?: () => void;
  onChatWithDriver?: () => void;
  onCallDriver?: () => void;
  loading?: boolean;
}

export default function DriverPreview({
  driver,
  onRequestChange,
  onChatWithDriver,
  onCallDriver,
  loading = false,
}: DriverPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-7 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!driver) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Driver Assignment</CardTitle>
          <CardDescription>
            A driver will be assigned once your booking is confirmed
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center justify-center py-4">
            <p className="text-sm text-muted-foreground">
              Drivers are typically assigned 24 hours before your scheduled move
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract driver initials for avatar fallback
  const initials = driver.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  // Format rating to one decimal place
  const formattedRating = driver.rating.toFixed(1);

  // Create an array of 5 stars with filled or unfilled based on rating
  const ratingStars = Array.from({ length: 5 }).map((_, i) => {
    const starValue = i + 1;
    // If rating is at least this star value, it's a full star
    // If rating is at least 0.5 less than this star value, it's a half star
    // Otherwise it's an empty star
    const isFilled = driver.rating >= starValue - 0.3;
    return (
      <Star
        key={i}
        className={`h-4 w-4 ${
          isFilled ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
        }`}
      />
    );
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Your Driver</CardTitle>
          {driver.verified && (
            <Badge variant="default" className="gap-1">
              <Shield className="h-3 w-3" /> Verified
            </Badge>
          )}
        </div>
        <CardDescription>
          {driver.availableAt 
            ? `Available at ${driver.availableAt}` 
            : 'Assigned to your booking'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border">
            <AvatarImage src={driver.profileImage} alt={driver.name} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-lg">{driver.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              {ratingStars}
              <span className="ml-1 text-sm font-medium">{formattedRating}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <ThumbsUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {driver.completedJobs} jobs completed
              </span>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-muted-foreground">Vehicle</span>
                <div className="flex items-center gap-2 mt-1">
                  <CarFront className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{driver.vehicleType}</span>
                </div>
                {driver.vehicleRegistration && (
                  <span className="text-xs block mt-1">
                    Reg: {driver.vehicleRegistration}
                  </span>
                )}
              </div>
              {driver.phoneNumber && (
                <div>
                  <span className="text-xs text-muted-foreground">Contact</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{driver.phoneNumber}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-xs w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Show more details'}
        </Button>
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        {onRequestChange && (
          <Button variant="outline" size="sm" className="flex-1" onClick={onRequestChange}>
            Request Change
          </Button>
        )}
        {onChatWithDriver && (
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 gap-1"
            onClick={onChatWithDriver}
          >
            <MessageCircle className="h-4 w-4" /> Chat
          </Button>
        )}
        {onCallDriver && driver.phoneNumber && (
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 gap-1"
            onClick={onCallDriver}
          >
            <Phone className="h-4 w-4" /> Call
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}