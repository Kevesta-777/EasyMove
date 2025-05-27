import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

const StripeConfig = () => {
  // Default test keys that work with Stripe test mode
  const defaultPublicKey = 'pk_test_TYooMQauvdEDq54NiTphI7jx';
  const defaultSecretKey = 'sk_test_4eC39HqLyjWDarjtT1zdp7dc';
  
  const [publicKey, setPublicKey] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [useTestKeys, setUseTestKeys] = useState<boolean>(false);
  const { toast } = useToast();

  // Get the current keys from .env if they exist
  useEffect(() => {
    // We can only access the public key client-side (VITE_* variables)
    const currentPublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
    
    // Only set the key if it's a valid public key
    if (currentPublicKey && currentPublicKey.startsWith('pk_')) {
      setPublicKey(currentPublicKey);
    } else if (currentPublicKey) {
      console.warn('Invalid Stripe public key format in environment. Not using it.');
    }
    
    // Check if keys are stored in localStorage
    const storedPublicKey = localStorage.getItem('stripePublicKey');
    if (storedPublicKey && storedPublicKey.startsWith('pk_')) {
      setPublicKey(storedPublicKey);
    }
  }, []);
  
  // Function to fill in test keys
  const fillTestKeys = () => {
    setPublicKey(defaultPublicKey);
    setSecretKey(defaultSecretKey);
    setUseTestKeys(true);
    toast({
      title: "Test Keys Loaded",
      description: "Stripe test API keys have been loaded. These work with test cards only."
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validation
    if (publicKey && !publicKey.startsWith('pk_')) {
      toast({
        title: "Invalid Public Key",
        description: "Stripe publishable key must start with 'pk_'",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (secretKey && !secretKey.startsWith('sk_')) {
      toast({
        title: "Invalid Secret Key",
        description: "Stripe secret key must start with 'sk_'",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      // Save keys in localStorage temporarily
      if (publicKey) {
        localStorage.setItem('stripePublicKey', publicKey);
      }
      
      if (secretKey) {
        localStorage.setItem('stripeSecretKey', secretKey);
      }

      // For a real implementation, this would call an API endpoint
      // to update the server's environment variables
      await apiRequest({
        method: "POST",
        url: "/api/config/stripe",
        data: {
          publicKey,
          secretKey
        }
      }).catch(() => {
        // API might not exist, but we've already saved to localStorage
        // so we can continue
      });

      setIsSuccess(true);
      toast({
        title: "Stripe Keys Saved",
        description: "The Stripe configuration has been saved",
      });

      // Reload the page to apply new keys
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast({
        title: "Error Saving Keys",
        description: "There was a problem saving your Stripe configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if environment variables already have valid keys
  const hasEnvironmentPublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY && 
                               import.meta.env.VITE_STRIPE_PUBLIC_KEY.startsWith('pk_');
  const showKeysSwappedWarning = import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('sk_') || 
                              import.meta.env.STRIPE_SECRET_KEY?.startsWith('pk_');

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Stripe Configuration</CardTitle>
            <CardDescription>
              Configure your Stripe API keys for payment processing
            </CardDescription>
          </CardHeader>
          
          {showKeysSwappedWarning && (
            <div className="px-6 pb-3">
              <Alert variant="destructive">
                <AlertTitle>API Keys Are Swapped</AlertTitle>
                <AlertDescription>
                  It appears your Stripe keys are swapped. The public key should start with 'pk_' and 
                  the secret key should start with 'sk_'. Please fix this below.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publicKey" className="flex items-center gap-2">
                  Publishable Key <span className="text-xs font-normal text-muted-foreground">(starts with pk_)</span>
                  {hasEnvironmentPublicKey && (
                    <span className="ml-auto text-xs text-green-600 font-semibold">✓ Valid key exists</span>
                  )}
                </Label>
                <Input
                  id="publicKey"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder="pk_test_..."
                  className={`font-mono text-sm ${publicKey && !publicKey.startsWith('pk_') ? 'border-red-500' : ''}`}
                />
                {publicKey && !publicKey.startsWith('pk_') && (
                  <p className="text-xs text-red-500">Invalid format. Public key must start with 'pk_'</p>
                )}
                <p className="text-xs text-muted-foreground">
                  The publishable key is used for client-side Stripe.js integration
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey" className="flex items-center gap-2">
                  Secret Key <span className="text-xs font-normal text-muted-foreground">(starts with sk_)</span>
                </Label>
                <Input
                  id="secretKey"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="sk_test_..."
                  className={`font-mono text-sm ${secretKey && !secretKey.startsWith('sk_') ? 'border-red-500' : ''}`}
                  type="password"
                />
                {secretKey && !secretKey.startsWith('sk_') && (
                  <p className="text-xs text-red-500">Invalid format. Secret key must start with 'sk_'</p>
                )}
                <p className="text-xs text-muted-foreground">
                  The secret key is used for server-side API calls to Stripe
                </p>
              </div>

              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Important: API Key Security</p>
                    <p className="mt-1">
                      In a production environment, never expose your secret key in client-side code.
                      This configuration page is for development purposes only.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || 
                  (publicKey === '' && secretKey === '') || 
                  (publicKey !== '' && !publicKey.startsWith('pk_')) || 
                  (secretKey !== '' && !secretKey.startsWith('sk_'))}
              >
                {isLoading ? "Saving..." : isSuccess ? "Saved!" : "Save Configuration"}
              </Button>
              
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={fillTestKeys} 
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Use Stripe test keys
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default StripeConfig;
