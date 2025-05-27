/**
 * Utility functions for validation
 */

/**
 * Basic validation for UK postcodes
 * This is a simple regex pattern that matches most UK postcode formats
 */
export function isValidUKPostcode(postcode: string): boolean {
  // Normalize the postcode by removing all whitespace and converting to uppercase
  const normalizedPostcode = postcode.replace(/\s+/g, '').toUpperCase();
  
  // UK postcode regex pattern
  const ukPostcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/;
  
  return ukPostcodePattern.test(normalizedPostcode);
}

/**
 * Checks if an address contains a valid-looking UK postcode
 */
export function isValidUKAddress(address: string): boolean {
  // Very basic check - address should be at least 10 characters long
  if (!address || address.length < 10) {
    return false;
  }
  
  // Extract potential postcode from the address
  // This regex looks for common UK postcode patterns at the end of the string
  const postcodeMatch = address.match(/[A-Z]{1,2}[0-9][A-Z0-9]?(\s*)[0-9][A-Z]{2}$/i);
  
  if (postcodeMatch) {
    return true;
  }
  
  // If no postcode match, check if the address at least contains house number and street name pattern
  const hasStreetPattern = /\d+\s+[A-Za-z]+(\s+[A-Za-z]+)*/i.test(address);
  
  return hasStreetPattern;
}

/**
 * Check if an address is within the London Congestion Charge zone
 * This is a simplified implementation that checks for common Central London postcodes
 */
export function isCongestionChargeZone(address: string): boolean {
  // Common Central London postcode areas that fall within the Congestion Charge zone
  const congestionZonePostcodes = [
    'EC1', 'EC2', 'EC3', 'EC4',
    'WC1', 'WC2',
    'W1', 'SE1'
  ];
  
  // Check if the address contains any of the congestion zone postcodes
  return congestionZonePostcodes.some(postcode => 
    address.toUpperCase().includes(postcode)
  );
}

/**
 * Validate a UK phone number
 */
export function isValidUKPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check for common UK phone number patterns
  if (digitsOnly.length === 11 && digitsOnly.startsWith('07')) {
    return true; // Mobile number
  }
  
  if (digitsOnly.length === 11 && digitsOnly.startsWith('01')) {
    return true; // Landline
  }
  
  if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
    return true; // Other UK number
  }
  
  return false;
}