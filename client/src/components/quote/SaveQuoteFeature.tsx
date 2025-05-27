import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Save, Share2, Mail, Clock, Copy, CheckCircle } from 'lucide-react';

interface SaveQuoteFeatureProps {
  quoteData: any;
  onSave?: (email: string) => Promise<boolean>;
  onShare?: (email: string) => Promise<boolean>;
}

export default function SaveQuoteFeature({
  quoteData,
  onSave,
  onShare,
}: SaveQuoteFeatureProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Generate a unique quote reference ID
  const quoteReference = `EM-${Date.now().toString().slice(-6)}`;

  // Get the expiry date (7 days from now)
  const getExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('en-GB');
  };

  // Handle saving quote for later
  const handleSaveQuote = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to save your quote",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Save quote to localStorage
      const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes') || '{}');
      savedQuotes[quoteReference] = {
        ...quoteData,
        email,
        savedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };
      localStorage.setItem('savedQuotes', JSON.stringify(savedQuotes));

      // Call the onSave callback if provided
      if (onSave) {
        await onSave(email);
      }

      toast({
        title: "Quote Saved",
        description: `Your quote has been saved and will be valid until ${getExpiryDate()}`,
        variant: "default",
      });

      setShowSaveDialog(false);
    } catch (error) {
      console.error('Error saving quote:', error);
      toast({
        title: "Error Saving Quote",
        description: "There was an error saving your quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle sharing quote via email
  const handleShareQuote = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to share your quote",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);

    try {
      // Call the onShare callback if provided
      if (onShare) {
        await onShare(email);
      } else {
        // Simulate email sharing
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      toast({
        title: "Quote Shared",
        description: `Your quote has been sent to ${email}`,
        variant: "default",
      });

      setShowShareDialog(false);
    } catch (error) {
      console.error('Error sharing quote:', error);
      toast({
        title: "Error Sharing Quote",
        description: "There was an error sharing your quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Handle copying quote link
  const handleCopyLink = () => {
    // Generate a shareable link
    const quoteLink = `${window.location.origin}/quote/${quoteReference}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(quoteLink).then(() => {
      setLinkCopied(true);
      
      toast({
        title: "Link Copied",
        description: "Quote link copied to clipboard",
        variant: "default",
      });
      
      // Reset copied state after 3 seconds
      setTimeout(() => setLinkCopied(false), 3000);
    }).catch(err => {
      console.error('Error copying link:', err);
      toast({
        title: "Error Copying Link",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Save Your Quote</CardTitle>
        <CardDescription>
          Keep this quote for later or share it with someone
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="bg-muted rounded-md p-3 flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="bg-primary/10 rounded-md p-2 mr-3">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Quote expires on</p>
              <p className="text-xs text-muted-foreground">{getExpiryDate()}</p>
            </div>
          </div>
          <div className="bg-muted/80 px-3 py-1 rounded text-xs font-medium">
            Ref: {quoteReference}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Save this quote to your email to access it later, or share it with friends and family.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-0">
        {/* Save Quote Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <Save className="h-4 w-4" /> Save Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save Your Quote</DialogTitle>
              <DialogDescription>
                Enter your email to save this quote and receive a copy. You can return anytime within 7 days.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>This quote will be valid until {getExpiryDate()}</span>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleSaveQuote}
                disabled={isSaving || !email.trim()}
                className="w-full"
              >
                {isSaving ? "Saving..." : "Save Quote"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Share Quote Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogTrigger asChild>
            <Button variant="default" className="w-full sm:w-auto gap-2">
              <Share2 className="h-4 w-4" /> Share Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Your Quote</DialogTitle>
              <DialogDescription>
                Share this quote via email or copy a direct link.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="share-email">Share via email</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-email"
                    type="email"
                    placeholder="recipient@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleShareQuote} 
                    disabled={isSharing || !email.trim()}
                    size="icon"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Copy link</Label>
                <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                  <span className="text-xs truncate flex-1">
                    {window.location.origin}/quote/{quoteReference}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1" 
                    onClick={handleCopyLink}
                  >
                    {linkCopied ? (
                      <>
                        <CheckCircle className="h-3 w-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}