/**
 * Google Maps API integration service
 * 
 * Provides accurate distance calculations, geocoding, and travel time estimates
 * using Google Maps Distance Matrix API and Geocoding API.
 */
import axios from 'axios';

// Get Google Maps API key from environment variables
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Calculate distance and travel time between two addresses using Google Maps Distance Matrix API
 */
export async function calculateGoogleMapsDistance(
  origin: string,
  destination: string
): Promise<{
  distance: number;
  durationMinutes: number;
  unit: string;
  status: string;
  originAddress?: string;
  destinationAddress?: string;
}> {
  try {
    // Check if API key is available
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    // Encode addresses for URL
    const encodedOrigin = encodeURIComponent(origin);
    const encodedDestination = encodeURIComponent(destination);

    // Make request to Distance Matrix API
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodedOrigin}&destinations=${encodedDestination}&units=imperial&key=${GOOGLE_MAPS_API_KEY}`
    );

    // Check if the request was successful
    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    // Extract results from response
    const results = response.data;
    
    // Make sure we have valid results
    if (
      !results.rows ||
      !results.rows[0] ||
      !results.rows[0].elements ||
      !results.rows[0].elements[0] ||
      results.rows[0].elements[0].status !== 'OK'
    ) {
      throw new Error('No valid route found between addresses');
    }

    // Get distance in miles (converting from meters)
    const distanceInMiles = results.rows[0].elements[0].distance.value / 1609.34;
    
    // Get duration in minutes (converting from seconds)
    const durationMinutes = Math.ceil(results.rows[0].elements[0].duration.value / 60);

    // Get formatted addresses
    const originAddress = results.origin_addresses[0];
    const destinationAddress = results.destination_addresses[0];

    // Return the calculated distance, duration, and addresses
    return {
      distance: parseFloat(distanceInMiles.toFixed(1)),
      durationMinutes,
      unit: 'miles',
      status: 'OK',
      originAddress,
      destinationAddress
    };
  } catch (error: any) {
    console.error('Google Maps distance calculation error:', error.message);
    // Return error with default values
    return {
      distance: 0,
      durationMinutes: 0,
      unit: 'miles',
      status: `ERROR: ${error.message}`
    };
  }
}

/**
 * Get coordinates for an address using Google Maps Geocoding API
 */
export async function geocodeAddress(address: string): Promise<{
  lat: number;
  lng: number;
  formattedAddress: string;
  status: string;
}> {
  try {
    // Check if API key is available
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    // Encode address for URL
    const encodedAddress = encodeURIComponent(address);

    // Make request to Geocoding API
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`
    );

    // Check if the request was successful
    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding API error: ${response.data.status}`);
    }

    // Extract results from response
    const results = response.data.results;
    
    // Make sure we have valid results
    if (!results || !results[0] || !results[0].geometry || !results[0].geometry.location) {
      throw new Error('No valid location found for address');
    }

    // Get coordinates and formatted address
    const location = results[0].geometry.location;
    const formattedAddress = results[0].formatted_address;

    // Return the coordinates and formatted address
    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress,
      status: 'OK'
    };
  } catch (error: any) {
    console.error('Geocoding error:', error.message);
    // Return error with default values
    return {
      lat: 0,
      lng: 0,
      formattedAddress: '',
      status: `ERROR: ${error.message}`
    };
  }
}

/**
 * Check if the Google Maps API key is valid and working
 */
export async function validateGoogleMapsApiKey(): Promise<boolean> {
  try {
    // Check if API key is available
    if (!GOOGLE_MAPS_API_KEY) {
      return false;
    }

    // Make a simple request to validate the API key
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=London&key=${GOOGLE_MAPS_API_KEY}`
    );

    // Check if the request was successful
    return response.data.status === 'OK';
  } catch (error) {
    console.error('Google Maps API key validation error:', error);
    return false;
  }
}