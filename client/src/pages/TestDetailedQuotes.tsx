import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Test data for different scenarios
const testCases = [
  {
    name: "Basic move with few items",
    data: {
      collectionAddress: "London, SE1",
      deliveryAddress: "London, NW1",
      vanSize: "small",
      moveDate: new Date().toISOString(),
      floorAccess: "ground",
      helpers: 0,
      itemDetails: {
        totalItems: 5,
        hasFragileItems: false,
        hasSpecialHandling: false,
        vanSizeAdjustment: 0,
        itemsList: [
          { name: "Small box", quantity: 3, fragile: false },
          { name: "Lamp", quantity: 2, fragile: true }
        ]
      }
    }
  },
  {
    name: "Medium move with fragile items",
    data: {
      collectionAddress: "Manchester, M1",
      deliveryAddress: "Liverpool, L1",
      vanSize: "medium",
      moveDate: new Date().toISOString(),
      floorAccess: "second",
      helpers: 1,
      itemDetails: {
        totalItems: 15,
        hasFragileItems: true,
        hasSpecialHandling: true,
        vanSizeAdjustment: 0.5,
        itemsList: [
          { name: "Medium box", quantity: 8, fragile: false },
          { name: "TV", quantity: 1, fragile: true, specialHandling: true },
          { name: "Mirror", quantity: 2, fragile: true },
          { name: "Desk", quantity: 1, specialHandling: true },
          { name: "Chair", quantity: 3 }
        ]
      }
    }
  },
  {
    name: "Large move with many items",
    data: {
      collectionAddress: "Edinburgh, EH1",
      deliveryAddress: "Glasgow, G1",
      vanSize: "luton",
      moveDate: new Date().toISOString(),
      floorAccess: "third",
      helpers: 2,
      itemDetails: {
        totalItems: 30,
        hasFragileItems: true,
        hasSpecialHandling: true,
        vanSizeAdjustment: 1,
        itemsList: [
          { name: "Large box", quantity: 15, fragile: false },
          { name: "Sofa", quantity: 1, specialHandling: true },
          { name: "Dining table", quantity: 1, specialHandling: true },
          { name: "Dining chairs", quantity: 6 },
          { name: "Bookshelf", quantity: 2 },
          { name: "Mattress", quantity: 2 },
          { name: "TV", quantity: 2, fragile: true },
          { name: "Glass cabinet", quantity: 1, fragile: true, specialHandling: true }
        ]
      }
    }
  }
];

export default function TestDetailedQuotes() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    const results = [];

    try {
      for (const testCase of testCases) {
        const result = await runTest(testCase);
        results.push(result);
        setTestResults([...results]);
      }
      
      toast({
        title: "Tests completed",
        description: `${results.length} tests completed successfully.`,
      });
    } catch (error) {
      console.error("Test execution error:", error);
      toast({
        title: "Test Error",
        description: "Some tests failed to execute. See console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runTest = async (testCase: any) => {
    try {
      console.log(`Running test: ${testCase.name}`);
      
      // Make the API request
      const response = await fetch('/api/quotes/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return {
        name: testCase.name,
        success: true,
        data: testCase.data,
        result,
        error: null
      };
    } catch (error: any) {
      return {
        name: testCase.name,
        success: false,
        data: testCase.data,
        result: null,
        error: error.message
      };
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Test Detailed Quote Calculation</h1>
      
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          This page runs test cases against the detailed quote calculation API to verify that
          item information is properly factored into the pricing.
        </p>
        <Button 
          onClick={runAllTests} 
          disabled={isLoading}
          className="min-w-[150px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : 'Run All Tests'}
        </Button>
      </div>
      
      <div className="space-y-6">
        {testResults.length === 0 && !isLoading && (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            No test results yet. Click "Run All Tests" to start testing.
          </div>
        )}
        
        {testResults.map((result, index) => (
          <Card key={index} className={result.success ? "border-green-200" : "border-red-200"}>
            <CardHeader className={result.success ? "bg-green-50" : "bg-red-50"}>
              <CardTitle className="flex items-center">
                {result.success ? (
                  <span className="text-green-600 mr-2">✓</span>
                ) : (
                  <span className="text-red-600 mr-2">✗</span>
                )}
                {result.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {result.success ? (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="font-medium mb-2">Request</h3>
                      <ul className="text-sm space-y-1">
                        <li><span className="font-medium">From:</span> {result.data.collectionAddress}</li>
                        <li><span className="font-medium">To:</span> {result.data.deliveryAddress}</li>
                        <li><span className="font-medium">Van Size:</span> {result.data.vanSize}</li>
                        <li><span className="font-medium">Floor Access:</span> {result.data.floorAccess}</li>
                        <li><span className="font-medium">Total Items:</span> {result.data.itemDetails.totalItems}</li>
                        <li><span className="font-medium">Has Fragile Items:</span> {result.data.itemDetails.hasFragileItems ? 'Yes' : 'No'}</li>
                        <li><span className="font-medium">Has Special Handling:</span> {result.data.itemDetails.hasSpecialHandling ? 'Yes' : 'No'}</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Response</h3>
                      <ul className="text-sm space-y-1">
                        <li><span className="font-medium">Distance:</span> {result.result.distance} miles</li>
                        <li><span className="font-medium">Price:</span> {result.result.priceString}</li>
                        <li><span className="font-medium">Estimated Time:</span> {result.result.estimatedTime}</li>
                        <li><span className="font-medium">VAT Amount:</span> £{result.result.vatAmount?.toFixed(2)}</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Price Breakdown</h3>
                    <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                      {result.result.breakdown?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-red-600">
                  <p className="font-medium">Error:</p>
                  <p>{result.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}