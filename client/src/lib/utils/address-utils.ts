/**
 * Utility functions for address handling
 */

/**
 * Extract a UK postcode from an address string
 */
export function extractPostcode(address: string): string | null {
  if (!address) return null;
  
  // UK postcode regex pattern
  // Matches patterns like SW1A 1AA, M1 1AA, B33 8TH, etc.
  const regex = /[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}/i;
  const match = address.match(regex);
  
  return match ? match[0].toUpperCase() : null;
}

/**
 * Extract city name from an address string
 */
export function extractCity(address: string): string | null {
  if (!address) return null;
  
  // List of major UK cities
  const ukCities = [
    'London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Newcastle',
    'Sunderland', 'Sheffield', 'Bristol', 'Nottingham', 'Cardiff', 'Glasgow',
    'Edinburgh', 'Belfast', 'Leicester', 'Coventry', 'Hull', 'Bradford',
    'Stoke', 'Wolverhampton', 'Plymouth', 'Southampton', 'Reading', 'Derby',
    'Middlesbrough', 'Huddersfield', 'Oxford', 'Cambridge', 'York', 'Northampton'
  ];
  
  // Check if any city name appears in the address
  for (const city of ukCities) {
    if (address.match(new RegExp('\\b' + city + '\\b', 'i'))) {
      return city;
    }
  }
  
  return null;
}

/**
 * Validate if an address is likely a valid UK address
 */
export function isValidUKAddress(address: string): boolean {
  if (!address || address.length < 5) return false;
  
  // Check for postcode
  const hasPostcode = extractPostcode(address) !== null;
  
  // Check for city name
  const hasCity = extractCity(address) !== null;
  
  // Check for common UK address components
  const hasStreet = /\b(street|st|road|rd|avenue|ave|lane|ln|drive|dr|way|close|cl)\b/i.test(address);
  
  // Valid if it has a postcode OR (a city name AND street indicator)
  return hasPostcode || (hasCity && hasStreet);
}

/**
 * Check if an address is likely within London (for congestion charge checks)
 */
export function isLondonAddress(address: string): boolean {
  if (!address) return false;
  
  // Convert to lowercase for case-insensitive matching
  const addressLower = address.toLowerCase();
  
  // Check for "london" in the address
  if (addressLower.includes('london')) {
    return true;
  }
  
  // Check for London postcodes (very simplified - a real version would be more comprehensive)
  const postcode = extractPostcode(address);
  if (postcode) {
    const prefix = postcode.substring(0, 2).toUpperCase();
    
    // Central London postcode areas
    const centralLondonPostcodes = ['EC', 'WC', 'SW', 'SE', 'W', 'E', 'N', 'NW'];
    
    return centralLondonPostcodes.includes(prefix);
  }
  
  return false;
}

/**
 * Check if an address is within the London Congestion Charge zone
 */
export function isCongestionChargeZone(address: string): boolean {
  if (!address) return false;
  
  // Convert to lowercase for case-insensitive matching
  const addressLower = address.toLowerCase();
  
  // Check for Central London indicators
  if (addressLower.includes('central london')) {
    return true;
  }
  
  // Extract postcode
  const postcode = extractPostcode(address);
  if (postcode) {
    // Simplified check for central London postcodes
    // A real implementation would use a more comprehensive list or geofencing
    const prefix = postcode.substring(0, 3).toUpperCase();
    
    // List of postcode prefixes in the London Congestion Charge zone
    const congestionZonePrefixes = [
      'EC1', 'EC2', 'EC3', 'EC4', 
      'WC1', 'WC2', 
      'W1', 'SW1',
      'SE1'
    ];
    
    return congestionZonePrefixes.includes(prefix);
  }
  
  return false;
}

/**
 * Check if an address is within the ULEZ (Ultra Low Emission Zone)
 */
export function isULEZZone(address: string): boolean {
  // Currently the ULEZ zone covers all of Greater London
  // So we just check if the address is in London
  return isLondonAddress(address);
}