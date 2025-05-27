/**
 * EasyMove Fixed Distance Calculator
 *
 * A reliable distance calculator that works without requiring the Google Maps API.
 * Uses multiple strategies for calculating distances:
 * 1. Exact distance database for common UK city pairs
 * 2. Enhanced Haversine calculation with UK-specific road winding factors
 * 3. Flexible address matching for partial or approximate locations
 */

// Common UK cities distances (in miles)
const UK_CITY_DISTANCES: Record<string, Record<string, number>> = {
  London: {
    Manchester: 200,
    Birmingham: 126,
    Leeds: 195,
    Glasgow: 403,
    Sheffield: 167,
    Edinburgh: 414,
    Liverpool: 213,
    Bristol: 118,
    Newcastle: 283,
    Cardiff: 150,
    Belfast: 518,
    Nottingham: 129,
    Southampton: 79,
    Brighton: 54,
    Oxford: 56,
    Cambridge: 64,
    York: 208,
    Leicester: 102,
    Aberdeen: 545,
    Coventry: 95,
    Northampton: 68,
  },
  Manchester: {
    London: 200,
    Birmingham: 86,
    Leeds: 43,
    Glasgow: 213,
    Sheffield: 38,
    Edinburgh: 219,
    Liverpool: 34,
    Bristol: 167,
    Newcastle: 141,
    Cardiff: 175,
    Belfast: 168,
    Nottingham: 70,
    Southampton: 216,
    Brighton: 254,
    Oxford: 146,
    Cambridge: 140,
    York: 67,
    Leicester: 89,
    Aberdeen: 351,
    Coventry: 99,
    Northampton: 107,
  },
  Birmingham: {
    London: 126,
    Manchester: 86,
    Leeds: 116,
    Glasgow: 290,
    Sheffield: 75,
    Edinburgh: 292,
    Liverpool: 99,
    Bristol: 87,
    Newcastle: 196,
    Cardiff: 104,
    Belfast: 259,
    Nottingham: 51,
    Southampton: 137,
    Brighton: 161,
    Oxford: 63,
    Cambridge: 97,
    York: 132,
    Leicester: 42,
    Aberdeen: 426,
    Coventry: 20,
    Northampton: 45,
  },
  Northampton: {
    London: 68,
    Birmingham: 45,
    Leeds: 115,
    Glasgow: 300,
    Sheffield: 94,
    Edinburgh: 320,
    Liverpool: 132,
    Bristol: 103,
    Newcastle: 211,
    Cardiff: 131,
    Belfast: 373,
    Nottingham: 60,
    Southampton: 122,
    Brighton: 130,
    Oxford: 45,
    Cambridge: 50,
    York: 139,
    Leicester: 30,
    Aberdeen: 450,
    Coventry: 35,
    Manchester: 107,
  },
  Brighton: {
    London: 54,
    Birmingham: 161,
    Leeds: 245,
    Glasgow: 457,
    Sheffield: 217,
    Edinburgh: 468,
    Liverpool: 268,
    Bristol: 139,
    Newcastle: 333,
    Cardiff: 171,
    Belfast: 568,
    Nottingham: 180,
    Southampton: 64,
    Northampton: 130,
    Oxford: 97,
    Cambridge: 118,
    York: 258,
    Leicester: 153,
    Aberdeen: 599,
    Coventry: 146,
    Manchester: 254,
  },
};

// UK postal code regex for finding postal codes in addresses
const UK_POSTCODE_REGEX = /[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}/i;

// Road winding factors based on region (estimated ratio of road distance to straight line)
const ROAD_WINDING_FACTORS: Record<string, number> = {
  default: 1.3, // UK average
  london: 1.4, // More complex road networks in London
  scotland: 1.5, // Mountainous terrain
  wales: 1.45, // Hilly terrain
  city: 1.35, // Urban areas
  rural: 1.35, // Rural areas
  coastal: 1.4, // Coastal routes
  motorway: 1.1, // Direct motorway routes
};

// Time estimation parameters
const AVERAGE_SPEED_MPH: Record<string, number> = {
  motorway: 55, // More realistic average speed including traffic
  city: 16, // Reduced for more accurate city travel times
  rural: 35, // Adjusted for rural roads with curves and traffic
  default: 28, // More conservative default speed
  long_distance: 50, // For journeys over 100 miles
};

/**
 * Calculate an estimated time for the journey based on distance and road types
 */
function estimateTime(distance: number, from: string, to: string): number {
  // Determine road type based on addresses
  let roadType = "default";
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  // Check for specific city pairs with known journey times
  const specificJourneys: Record<string, number> = {
    northamptonbrighton: 159, // 2h 39m
    brightonnorthampton: 159, // 2h 39m
    northamptonlondon: 82, // 1h 22m
    londonnorthampton: 82, // 1h 22m
  };

  // Check for specific postcode pairs that need accurate times
  const specificPostcodePairs: Record<string, number> = {
    pe25etpe78ba: 15, // 15 minutes - nearby Peterborough postcodes
    pe78bape25et: 15, // 15 minutes - nearby Peterborough postcodes
  };

  // Extract postcodes from addresses
  const fromPostcode = extractUKPostcode(fromLower);
  const toPostcode = extractUKPostcode(toLower);

  // Check if we have a predefined time for this specific postcode pair
  if (fromPostcode && toPostcode) {
    const cleanFromPostcode = fromPostcode.replace(/\s+/g, "").toLowerCase();
    const cleanToPostcode = toPostcode.replace(/\s+/g, "").toLowerCase();
    const postcodeKey = cleanFromPostcode + cleanToPostcode;

    if (specificPostcodePairs[postcodeKey]) {
      return specificPostcodePairs[postcodeKey]; // Return the predefined time in minutes
    }
  }

  // Create a normalized key by combining from and to cities without spaces
  const fromCity = extractSpecificCity(fromLower);
  const toCity = extractSpecificCity(toLower);
  const journeyKey = fromCity + toCity;

  // Check if we have a predefined journey time for this specific route
  if (fromCity && toCity && specificJourneys[journeyKey]) {
    return specificJourneys[journeyKey]; // Return the predefined time in minutes
  }

  // Check if it's a major city to major city route (likely motorway)
  const isMajorCity = (address: string) => {
    const majorCities = [
      "london",
      "manchester",
      "birmingham",
      "leeds",
      "glasgow",
      "edinburgh",
      "liverpool",
      "bristol",
      "newcastle",
      "cardiff",
      "belfast",
      "brighton",
      "northampton",
    ];
    return majorCities.some((city) => address.includes(city));
  };

  // Determine the road type for the journey
  if (isMajorCity(fromLower) && isMajorCity(toLower)) {
    roadType = "motorway";
  } else if (fromLower.includes("london") || toLower.includes("london")) {
    // Routes involving London
    if (distance < 10) {
      roadType = "city"; // Inside London
    } else {
      roadType = "motorway"; // From/to London to elsewhere
    }
  } else if (distance < 5) {
    roadType = "city"; // Short distances are likely in cities
  } else if (distance > 100) {
    roadType = "long_distance"; // Long distances use the long_distance speed
  } else {
    // Mixed routes
    const cityPatterns = [
      "city",
      "centre",
      "center",
      "town",
      "highstreet",
      "street",
    ];
    if (
      cityPatterns.some(
        (pattern) => fromLower.includes(pattern) || toLower.includes(pattern),
      )
    ) {
      roadType = "city";
    }

    const ruralPatterns = ["village", "farm", "lane", "rural", "countryside"];
    if (
      ruralPatterns.some(
        (pattern) => fromLower.includes(pattern) || toLower.includes(pattern),
      )
    ) {
      roadType = "rural";
    }
  }

  // Calculate the base driving time in minutes
  const avgSpeed = AVERAGE_SPEED_MPH[roadType];
  const drivingTimeMinutes = Math.ceil((distance / avgSpeed) * 60);

  // Add break times for longer journeys
  let breakTime = 0;
  if (distance > 100) {
    // Add a 15-minute break for every 2 hours of driving
    breakTime = Math.floor(drivingTimeMinutes / 120) * 15;
  }

  // Add extra time for deliveries to/from busy areas
  let congestionTime = 0;
  if (fromLower.includes("london") || toLower.includes("london")) {
    congestionTime += 20; // Extra time for London traffic
  }
  if (fromLower.includes("brighton") || toLower.includes("brighton")) {
    congestionTime += 15; // Extra time for Brighton traffic
  }
  if (distance > 50) {
    // Add potential traffic delays for longer journeys
    congestionTime += 10; // Extra time for potential traffic on long journeys
  }

  // Add loading/unloading time (15 mins at each end)
  const loadingTime = 30;

  // Total time is driving time + break time + congestion time + loading time
  return drivingTimeMinutes + breakTime + congestionTime + loadingTime;
}

/**
 * Extract a specific city name from an address for journey time lookup
 */
function extractSpecificCity(address: string): string {
  const cityPatterns = [
    { pattern: /\bnorthampton\b/i, cityName: "northampton" },
    { pattern: /\bbrighton\b/i, cityName: "brighton" },
    { pattern: /\blondon\b/i, cityName: "london" },
    { pattern: /\bmanchester\b/i, cityName: "manchester" },
    { pattern: /\bbirmingham\b/i, cityName: "birmingham" },
  ];

  for (const { pattern, cityName } of cityPatterns) {
    if (pattern.test(address)) {
      return cityName;
    }
  }

  return "";
}

/**
 * Extract city names from addresses for city pair lookup
 */
function extractCityNames(address: string): string[] {
  // Common UK city list
  const ukCities = [
    "London",
    "Manchester",
    "Birmingham",
    "Leeds",
    "Glasgow",
    "Sheffield",
    "Edinburgh",
    "Liverpool",
    "Bristol",
    "Newcastle",
    "Cardiff",
    "Belfast",
    "Nottingham",
    "Southampton",
    "Brighton",
    "Oxford",
    "Cambridge",
    "York",
    "Leicester",
    "Aberdeen",
    "Coventry",
    "Northampton",
  ];

  // Normalize address and remove postcodes
  const normalizedAddress = address
    .replace(UK_POSTCODE_REGEX, "") // Remove postcodes
    .replace(/[,\.]/g, " ") // Replace punctuation with spaces
    .toLowerCase();

  // Find cities in the address
  return ukCities.filter((city) =>
    normalizedAddress.includes(city.toLowerCase()),
  );
}

/**
 * Calculate distance using the Haversine formula (great-circle distance)
 * with UK-specific adjustments
 */
function calculateHaversineWithUKAdjustments(
  fromPostcode: string | null,
  toPostcode: string | null,
  fromAddress: string,
  toAddress: string,
): { distance: number; exactCalculation: boolean } {
  // Use UK postcode approximations when exact coordinates are not available
  // This is a simplified approach - in a real app, we would use a postcode database

  // Default to central London if no location data available
  let fromLat = 51.509865;
  let fromLng = -0.118092;
  let toLat = 51.509865;
  let toLng = -0.118092;

  // Enhanced UK postcode area approximations with focus on requested service areas
  // North East, London, West Midlands, Essex, and Peterborough
  const postcodeApproximations: Record<string, [number, number]> = {
    // London areas
    E: [51.52, -0.05], // East London
    E1: [51.5175, -0.0628], // Whitechapel, Stepney, Mile End
    E2: [51.5295, -0.0556], // Bethnal Green, Shoreditch
    E3: [51.5268, -0.0247], // Bow, Bromley-by-Bow
    E4: [51.6314, -0.0006], // Chingford, Highams Park
    E5: [51.5584, -0.0526], // Clapton
    E6: [51.5141, 0.0507], // East Ham
    E7: [51.5458, 0.0254], // Forest Gate, Upton Park
    E8: [51.5426, -0.0619], // Hackney, Dalston
    E9: [51.5422, -0.0452], // Hackney, Homerton
    E10: [51.5674, -0.0121], // Leyton
    E11: [51.5684, 0.0099], // Leytonstone
    E12: [51.5507, 0.0457], // Manor Park
    E13: [51.5268, 0.0258], // Plaistow
    E14: [51.5056, -0.0183], // Poplar, Isle of Dogs, Canary Wharf
    E15: [51.5392, 0.0056], // Stratford, West Ham
    E16: [51.5126, 0.0212], // Canning Town, North Woolwich
    E17: [51.5839, -0.0208], // Walthamstow
    E18: [51.5913, 0.0245], // Woodford, South Woodford
    E20: [51.5469, -0.0068], // Olympic Park
    EC: [51.515, -0.09], // East Central London
    EC1: [51.5236, -0.1069], // Clerkenwell, Farringdon, Barbican
    EC2: [51.5209, -0.0895], // Moorgate, Liverpool Street
    EC3: [51.5136, -0.0829], // Monument, Tower Hill
    EC4: [51.5149, -0.1006], // Fleet Street, St. Paul's
    N: [51.55, -0.09], // North London
    N1: [51.5385, -0.0961], // Islington, Kings Cross
    NW: [51.54, -0.18], // North West London
    NW1: [51.5297, -0.1424], // Camden Town, Regent's Park
    SE: [51.47, -0.06], // South East London
    SE1: [51.4985, -0.0856], // Waterloo, Southwark, London Bridge
    SW: [51.47, -0.19], // South West London
    SW1: [51.4977, -0.1376], // Westminster, Belgravia, Pimlico
    W: [51.51, -0.21], // West London
    W1: [51.5136, -0.141], // Mayfair, Soho, Marylebone
    WC: [51.515, -0.12], // West Central London
    WC1: [51.5235, -0.1249], // Bloomsbury, Holborn
    WC2: [51.513, -0.1223], // Covent Garden, Strand

    // North East
    NE1: [54.9739, -1.6131], // Newcastle upon Tyne city center
    NE2: [54.9869, -1.5994], // Jesmond, Heaton
    NE3: [55.0071, -1.6268], // Gosforth, Fawdon
    NE4: [54.9818, -1.6356], // Fenham, Arthurs Hill
    NE5: [54.9965, -1.6769], // Westerhope, Newbiggin Hall
    NE6: [54.9776, -1.5612], // Walker, Byker
    NE7: [54.997, -1.5768], // High Heaton
    NE8: [54.958, -1.6055], // Gateshead
    NE10: [54.9464, -1.5539], // Felling
    NE11: [54.9373, -1.6429], // Team Valley, Lamesley
    NE12: [55.0177, -1.5684], // Killingworth, Forest Hall
    NE13: [55.0483, -1.6538], // Dinnington, Brunswick Village
    NE15: [54.9859, -1.7187], // Newburn, Throckley
    NE16: [54.946, -1.7172], // Whickham, Sunniside
    NE20: [55.0507, -1.7685], // Ponteland
    NE21: [54.9591, -1.751], // Blaydon, Winlaton
    NE22: [55.1366, -1.5911], // Bedlington
    NE23: [55.0815, -1.5824], // Cramlington
    NE24: [55.1204, -1.5223], // Blyth
    NE25: [55.0696, -1.4741], // Whitley Bay
    NE26: [55.0432, -1.4528], // Monkseaton, Whitley Bay
    NE27: [55.0343, -1.5044], // West Monkseaton
    NE28: [54.9923, -1.5098], // Wallsend
    NE29: [55.0126, -1.4583], // North Shields
    NE30: [55.0205, -1.4389], // North Shields, Tynemouth
    NE31: [54.9785, -1.484], // Hebburn
    NE32: [54.9602, -1.4828], // Jarrow
    NE33: [54.9974, -1.428], // South Shields
    NE34: [54.972, -1.4167], // South Shields
    NE35: [54.9489, -1.4534], // Boldon Colliery
    NE36: [54.9399, -1.4368], // East Boldon
    NE37: [54.9003, -1.523], // Washington
    NE38: [54.8931, -1.5495], // Washington
    NE39: [54.9213, -1.8217], // Rowlands Gill
    NE40: [54.9747, -1.8079], // Ryton
    NE41: [54.9735, -1.8836], // Wylam
    NE42: [54.9629, -1.8448], // Prudhoe
    NE43: [54.9533, -1.906], // Stocksfield
    NE44: [54.9601, -2.0156], // Riding Mill
    NE45: [54.9716, -2.0244], // Corbridge
    NE46: [54.9719, -2.1035], // Hexham
    NE47: [54.9694, -2.2453], // Allendale
    NE48: [55.1406, -2.2574], // Bellingham
    NE49: [54.9712, -2.4601], // Haltwhistle
    SR1: [54.9062, -1.3819], // Sunderland city center
    SR2: [54.8944, -1.377], // Ashbrooke, Thornhill
    SR3: [54.8835, -1.4101], // Silksworth, Tunstall
    SR4: [54.8997, -1.4216], // Barnes, Millfield
    SR5: [54.9228, -1.4175], // Southwick, Castletown
    SR6: [54.9346, -1.3845], // Fulwell, Seaburn
    SR7: [54.8179, -1.3644], // Dalton-le-Dale, Seaham
    SR8: [54.7624, -1.342], // Peterlee
    DH1: [54.7787, -1.5785], // Durham city
    TS1: [54.574, -1.238], // Middlesbrough town center

    // West Midlands
    B: [52.48, -1.89], // Birmingham
    B1: [52.4791, -1.9098], // Birmingham city center
    B2: [52.4826, -1.898], // Birmingham city center
    B3: [52.4852, -1.9034], // Birmingham city center
    B4: [52.4873, -1.8935], // Birmingham city center
    B5: [52.4707, -1.8954], // Digbeth, Highgate
    B6: [52.5071, -1.8887], // Aston
    B7: [52.4973, -1.8785], // Nechells
    B8: [52.4918, -1.8526], // Washwood Heath, Ward End
    B9: [52.4787, -1.8586], // Bordesley Green
    B10: [52.4669, -1.8626], // Small Heath
    B11: [52.4532, -1.8655], // Sparkhill
    B12: [52.4608, -1.8851], // Balsall Heath
    B13: [52.4377, -1.8763], // Moseley, Kings Heath
    B14: [52.4187, -1.887], // Kings Heath, Yardley Wood
    B15: [52.4684, -1.9266], // Edgbaston
    B16: [52.4776, -1.9299], // Ladywood
    B17: [52.4557, -1.9542], // Harborne
    B18: [52.4923, -1.9175], // Hockley, Newtown
    B19: [52.4943, -1.9017], // Lozells, Newtown
    B20: [52.5127, -1.9111], // Birchfield, Handsworth Wood
    B21: [52.5063, -1.9311], // Handsworth
    B23: [52.5336, -1.8439], // Erdington, Short Heath
    B24: [52.5175, -1.8188], // Erdington, Tyburn
    B25: [52.4542, -1.8196], // Yardley
    B26: [52.4481, -1.7929], // Sheldon, Yardley
    B27: [52.436, -1.8287], // Acocks Green
    B28: [52.4283, -1.8389], // Hall Green
    B29: [52.4298, -1.9385], // Selly Oak, Bournville
    B30: [52.419, -1.9224], // Bournville, Stirchley
    B31: [52.4071, -1.9626], // Northfield
    B32: [52.4254, -2.0053], // Quinton
    B33: [52.4699, -1.7823], // Kitts Green, Stechford
    B34: [52.4828, -1.7772], // Shard End
    B35: [52.5123, -1.7871], // Castle Vale
    B36: [52.5011, -1.781], // Castle Bromwich
    B37: [52.4694, -1.753], // Chelmsley Wood
    B38: [52.3978, -1.9341], // Kings Norton
    B40: [52.4539, -1.7221], // Birmingham Airport
    B42: [52.5344, -1.9108], // Perry Barr
    B43: [52.5459, -1.9276], // Great Barr
    B44: [52.5463, -1.8895], // Perry Barr, Kingstanding
    B45: [52.3891, -1.9755], // Rednal, Rubery
    B46: [52.5217, -1.6938], // Coleshill
    B47: [52.375, -1.8794], // Hollywood, Wythall
    B48: [52.3624, -1.9421], // Alvechurch
    B49: [52.2142, -1.8695], // Alcester
    B50: [52.1689, -1.8525], // Bidford-on-Avon
    B60: [52.3219, -1.9513], // Bromsgrove
    B61: [52.3328, -2.0062], // Bromsgrove
    B62: [52.4528, -2.0168], // Halesowen
    B63: [52.4564, -2.0507], // Halesowen
    B64: [52.4731, -2.0526], // Cradley Heath
    B65: [52.4829, -2.0378], // Rowley Regis
    B66: [52.4933, -1.9762], // Smethwick
    B67: [52.4842, -1.9834], // Smethwick
    B68: [52.4757, -2.0033], // Oldbury
    B69: [52.5006, -2.023], // Oldbury
    B70: [52.5168, -2.0072], // West Bromwich
    B71: [52.5307, -1.9865], // West Bromwich
    B72: [52.554, -1.8198], // Sutton Coldfield
    B73: [52.5434, -1.8352], // Sutton Coldfield
    B74: [52.5795, -1.8593], // Sutton Coldfield
    B75: [52.5689, -1.8173], // Sutton Coldfield
    B76: [52.5353, -1.7797], // Walmley
    B77: [52.6067, -1.6723], // Tamworth
    B78: [52.6216, -1.6871], // Tamworth
    B79: [52.6511, -1.6783], // Tamworth
    B80: [52.287, -1.8838], // Studley
    B90: [52.4081, -1.8219], // Shirley, Solihull
    B91: [52.4133, -1.7747], // Solihull
    B92: [52.4342, -1.7693], // Solihull
    B93: [52.3928, -1.7398], // Knowle, Solihull
    B94: [52.3685, -1.7896], // Tanworth-in-Arden
    B95: [52.2938, -1.7773], // Henley-in-Arden
    B96: [52.2635, -1.9341], // Redditch
    B97: [52.3016, -1.9491], // Redditch
    B98: [52.309, -1.9175], // Redditch
    CV: [52.4, -1.51], // Coventry
    WV: [52.59, -2.11], // Wolverhampton
    DY: [52.51, -2.13], // Dudley

    // Essex areas
    RM: [51.559, 0.209], // Romford (general)
    RM1: [51.5769, 0.1849], // Romford central
    RM2: [51.5857, 0.2037], // Gidea Park
    RM3: [51.596, 0.2196], // Harold Wood, Harold Hill
    RM4: [51.6193, 0.1676], // Havering-atte-Bower
    RM5: [51.5892, 0.1641], // Collier Row
    RM6: [51.5676, 0.1277], // Chadwell Heath
    RM7: [51.5658, 0.1556], // Romford, Rush Green
    RM8: [51.5468, 0.1301], // Dagenham (Becontree)
    RM9: [51.5418, 0.1517], // Dagenham
    RM10: [51.535, 0.1683], // Dagenham
    RM11: [51.5701, 0.2298], // Hornchurch (Emerson Park)
    RM12: [51.5539, 0.216], // Hornchurch
    RM13: [51.5237, 0.205], // Rainham
    RM14: [51.5559, 0.2636], // Upminster
    RM15: [51.5101, 0.27], // South Ockendon
    RM16: [51.4915, 0.3365], // Grays (Chafford Hundred)
    RM17: [51.4808, 0.2875], // Grays
    RM18: [51.4711, 0.374], // Tilbury
    RM19: [51.4803, 0.2483], // Purfleet
    RM20: [51.4846, 0.2766], // Grays (West Thurrock)
    SS: [51.54, 0.71], // Southend-on-Sea
    SS0: [51.5384, 0.701], // Westcliff-on-Sea
    SS1: [51.5369, 0.7291], // Southend-on-Sea center
    SS2: [51.5489, 0.71], // Southend, Prittlewell
    SS3: [51.5299, 0.8043], // Shoeburyness
    SS4: [51.5862, 0.6536], // Rochford
    SS5: [51.6004, 0.6068], // Hockley
    SS6: [51.583, 0.5885], // Rayleigh
    SS7: [51.5651, 0.5621], // Benfleet
    SS8: [51.5224, 0.5711], // Canvey Island
    SS9: [51.5423, 0.6427], // Leigh-on-Sea
    SS11: [51.6145, 0.5692], // Wickford
    SS12: [51.6126, 0.5272], // Wickford
    SS13: [51.5789, 0.5062], // Basildon
    SS14: [51.5726, 0.4792], // Basildon
    SS15: [51.5776, 0.4395], // Basildon (Laindon)
    SS16: [51.5577, 0.4544], // Basildon (Vange)
    SS17: [51.5108, 0.4246], // Stanford-le-Hope
    CM: [51.87, 0.55], // Chelmsford (general)
    CM1: [51.7476, 0.4502], // Chelmsford
    CM2: [51.7223, 0.4777], // Great Baddow, Chelmsford
    CO: [51.89, 0.9], // Colchester
    IG: [51.56, 0.05], // Ilford
    EN: [51.65, -0.09], // Enfield

    // Peterborough area (with more detailed postcodes)
    PE: [52.58, -0.25], // Peterborough (general)
    PE1: [52.5786, -0.2404], // Peterborough city center
    PE2: [52.5556, -0.2403], // Peterborough South
    PE3: [52.5793, -0.2762], // Peterborough West
    PE4: [52.6106, -0.2625], // Peterborough North
    PE5: [52.5659, -0.3887], // Peterborough villages
    PE6: [52.6816, -0.2634], // Market Deeping area
    PE7: [52.55, -0.18], // Peterborough East
    PE8: [52.5113, -0.4363], // Oundle
    PE9: [52.651, -0.4759], // Stamford
    PE10: [52.7675, -0.3769], // Bourne
    PE11: [52.7958, -0.2011], // Spalding
    PE12: [52.8086, -0.0307], // Spalding area
    PE13: [52.6721, 0.1463], // Wisbech
    PE14: [52.6409, 0.2211], // Wisbech area
    PE15: [52.551, 0.118], // March
    PE16: [52.4563, 0.0514], // Chatteris
    PE19: [52.2293, -0.2581], // St Neots
    PE20: [52.9619, -0.075], // Boston area
    PE21: [52.9749, -0.0293], // Boston
    PE22: [53.0581, 0.0406], // Boston area
    PE23: [53.1724, 0.11], // Spilsby
    PE24: [53.1461, 0.3305], // Skegness area
    PE25: [53.1455, 0.3388], // Skegness
    PE26: [52.435, -0.1146], // Ramsey
    PE27: [52.329, -0.0713], // St Ives
    PE28: [52.3558, -0.1865], // Huntingdon area
    PE29: [52.3308, -0.185], // Huntingdon
    PE30: [52.7525, 0.4088], // King's Lynn
    PE31: [52.8488, 0.6599], // Fakenham area
    PE32: [52.6904, 0.5743], // East Rudham
    PE33: [52.6251, 0.4966], // Downham Market area
    PE34: [52.6207, 0.354], // Downham Market
    PE35: [52.8263, 0.5126], // Sandringham
    PE36: [52.9354, 0.4932], // Hunstanton
    PE37: [52.6317, 0.7027], // Swaffham
    PE38: [52.5949, 0.3782], // Downham Market area
  };

  // Function to extract postcode area and district
  function extractPostcodeArea(postcode: string | null): string | null {
    if (!postcode) return null;

    // First try to match the district (like PE2, PE7)
    const districtMatch = postcode.match(/^[A-Z]{1,2}[0-9]{1,2}/i);
    if (
      districtMatch &&
      postcodeApproximations[districtMatch[0].toUpperCase()]
    ) {
      return districtMatch[0].toUpperCase();
    }

    // Fall back to just the area (like PE)
    const areaMatch = postcode.match(/^[A-Z]{1,2}/i);
    return areaMatch ? areaMatch[0].toUpperCase() : null;
  }

  // Try to get coordinates from postcodes
  const fromArea = extractPostcodeArea(fromPostcode);
  const toArea = extractPostcodeArea(toPostcode);

  if (fromArea && postcodeApproximations[fromArea]) {
    [fromLat, fromLng] = postcodeApproximations[fromArea];
  }

  if (toArea && postcodeApproximations[toArea]) {
    [toLat, toLng] = postcodeApproximations[toArea];
  }

  // Calculate Haversine distance (great-circle)
  const toRadians = (degree: number) => degree * (Math.PI / 180);

  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLng - fromLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineDistance = R * c;

  // Determine the appropriate winding factor
  let windingFactor = ROAD_WINDING_FACTORS.default;

  const addresses = (fromAddress + " " + toAddress).toLowerCase();
  if (addresses.includes("london")) {
    windingFactor = ROAD_WINDING_FACTORS.london;
  } else if (
    addresses.includes("scotland") ||
    addresses.includes("edinburgh") ||
    addresses.includes("glasgow")
  ) {
    windingFactor = ROAD_WINDING_FACTORS.scotland;
  } else if (addresses.includes("wales") || addresses.includes("cardiff")) {
    windingFactor = ROAD_WINDING_FACTORS.wales;
  }

  // Apply winding factor to get the road distance
  const roadDistance = Math.round(straightLineDistance * windingFactor);

  return {
    distance: roadDistance,
    exactCalculation: false, // This is always approximate
  };
}

/**
 * Extract UK postcodes from an address string
 */
function extractUKPostcode(address: string): string | null {
  const match = address.match(UK_POSTCODE_REGEX);
  return match ? match[0] : null;
}

/**
 * Main distance calculation function using multiple approaches
 */
export async function calculateDistance(
  from: string,
  to: string,
): Promise<{
  distance: number;
  unit: string;
  estimatedTime: number;
  exactCalculation: boolean;
}> {
  // Try to find both addresses in our city distance database for exact data
  const fromCities = extractCityNames(from);
  const toCities = extractCityNames(to);

  // Check if we have an exact match in our city distance database
  for (const fromCity of fromCities) {
    if (UK_CITY_DISTANCES[fromCity]) {
      for (const toCity of toCities) {
        const distance = UK_CITY_DISTANCES[fromCity][toCity];
        if (distance) {
          // We have an exact city-to-city match!
          return {
            distance,
            unit: "miles",
            estimatedTime: estimateTime(distance, from, to),
            exactCalculation: true,
          };
        }
      }
    }
  }

  // If we couldn't find an exact match, try to use UK postcodes
  const fromPostcode = extractUKPostcode(from);
  const toPostcode = extractUKPostcode(to);

  // Calculate using Haversine with UK adjustments
  const { distance, exactCalculation } = calculateHaversineWithUKAdjustments(
    fromPostcode,
    toPostcode,
    from,
    to,
  );

  // Calculate estimated time based on the distance and addresses
  const estimatedTimeMinutes = estimateTime(distance, from, to);

  // Return the result
  return {
    distance,
    unit: "miles",
    estimatedTime: estimatedTimeMinutes,
    exactCalculation,
  };
}
