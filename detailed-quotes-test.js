/**
 * EasyMove Man and Van - Detailed Quote Testing Tool
 * 
 * This script helps test the detailed quote calculation with various item combinations
 * to ensure the server is properly processing detailed item data.
 */

// Test data for different scenarios
const testCases = [
  {
    name: "Basic move with few items",
    data: {
      from: "London, SE1",
      to: "London, NW1",
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
      from: "Manchester, M1",
      to: "Liverpool, L1",
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
      from: "Edinburgh, EH1",
      to: "Glasgow, G1",
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

// Function to run the tests
async function runDetailedQuoteTests() {
  console.log("EasyMove Man and Van - Testing Detailed Quote Calculation");
  
  for (const testCase of testCases) {
    console.log(`\nRunning test: ${testCase.name}`);
    try {
      // Format the request data
      const requestData = {
        collectionAddress: testCase.data.from,
        deliveryAddress: testCase.data.to,
        vanSize: testCase.data.vanSize,
        moveDate: testCase.data.moveDate,
        floorAccess: testCase.data.floorAccess,
        helpers: testCase.data.helpers,
        itemDetails: testCase.data.itemDetails
      };
      
      console.log(`Requesting quote with ${testCase.data.itemDetails.totalItems} items...`);
      
      // Make the API request
      const response = await fetch('/api/quotes/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Print the results
      console.log(`✓ Quote calculated successfully!`);
      console.log(`  Distance: ${result.distance} miles`);
      console.log(`  Total price: ${result.priceString}`);
      console.log(`  Estimated time: ${result.estimatedTime}`);
      console.log(`  Price breakdown:`);
      
      if (result.breakdown) {
        result.breakdown.forEach(item => {
          console.log(`    - ${item}`);
        });
      }
      
      console.log(`\nIs the price reasonable? ${result.totalPrice > 0 ? 'Yes' : 'No'}`);
      console.log(`Is time estimate affected by item count? ${result.estimatedTime.includes('hour') ? 'Yes' : 'No'}`);
      
    } catch (error) {
      console.error(`✗ Test failed: ${error.message}`);
    }
  }

  console.log("All tests completed!");
}

// Execute tests when script is loaded
runDetailedQuoteTests();