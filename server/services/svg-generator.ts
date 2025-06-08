import fs from "fs";
import path from "path";
import { promisify } from "util";

// Define VanSize type inline to avoid schema dependency
type VanSize = "small" | "medium" | "large" | "luton";

// Convert fs functions to promises
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

// Directory for storing generated SVGs
const SVG_DIR = path.join(process.cwd(), "client/src/assets/generated");

// Make sure the directory exists
async function ensureDirectoryExists() {
  try {
    await access(SVG_DIR);
  } catch (error) {
    await mkdir(SVG_DIR, { recursive: true });
  }
}

// Generate a van SVG based on size
export async function generateVanSVG(vanSize: VanSize): Promise<string> {
  await ensureDirectoryExists();
  
  // Check if we already have this SVG
  const svgPath = path.join(SVG_DIR, `${vanSize}-van.svg`);
  const clientPath = `/src/assets/generated/${vanSize}-van.svg`;
  
  // Check if file already exists
  try {
    await access(svgPath);
    console.log(`SVG for ${vanSize} van already exists`);
    return clientPath;
  } catch (error) {
    // File does not exist, generate it
    console.log(`Generating SVG for ${vanSize} van`);
  }
  
  let svgContent = "";
  
  // Create SVGs based on van size
  switch (vanSize) {
    case "small":
      svgContent = generateSmallVanSVG();
      break;
    case "medium":
      svgContent = generateMediumVanSVG();
      break;
    case "large":
      svgContent = generateLargeVanSVG();
      break;
    case "luton":
      svgContent = generateLutonVanSVG();
      break;
  }
  
  // Save the SVG
  await writeFile(svgPath, svgContent);
  console.log(`SVG for ${vanSize} van saved to ${svgPath}`);
  return clientPath;
}

// Generate service-related SVG images
export async function generateServiceSVG(service: string): Promise<string> {
  await ensureDirectoryExists();
  
  // Convert service name to a file-friendly format
  const serviceKey = service.toLowerCase().replace(/\\s+/g, '-');
  
  // Check if we already have this SVG
  const svgPath = path.join(SVG_DIR, `${serviceKey}.svg`);
  const clientPath = `/src/assets/generated/${serviceKey}.svg`;
  
  // Check if file already exists
  try {
    await access(svgPath);
    console.log(`SVG for ${service} already exists`);
    return clientPath;
  } catch (error) {
    // File does not exist, generate it
    console.log(`Generating SVG for ${service}`);
  }
  
  // Generate appropriate SVG based on service type
  let svgContent = "";
  
  switch (serviceKey) {
    case "house-removals":
      svgContent = generateHouseRemovalsSVG();
      break;
    case "office-relocations":
      svgContent = generateOfficeRelocationsSVG();
      break;
    case "student-moves":
      svgContent = generateStudentMovesSVG();
      break;
    case "furniture-delivery":
      svgContent = generateFurnitureDeliverySVG();
      break;
    case "ikea-collection":
      svgContent = generateIkeaCollectionSVG();
      break;
    default:
      svgContent = generateGenericServiceSVG(service);
  }
  
  // Save the SVG
  await writeFile(svgPath, svgContent);
  console.log(`SVG for ${service} saved to ${svgPath}`);
  return clientPath;
}

// Generate hero image SVG
export async function generateHeroSVG(description: string): Promise<string> {
  await ensureDirectoryExists();
  
  // Generate a unique key for this hero image
  const heroKey = `hero-${Date.now()}`;
  
  // File paths
  const svgPath = path.join(SVG_DIR, `${heroKey}.svg`);
  const clientPath = `/src/assets/generated/${heroKey}.svg`;
  
  // Generate hero SVG
  const svgContent = generateHeroSectionSVG();
  
  // Save the SVG
  await writeFile(svgPath, svgContent);
  console.log(`Hero SVG saved to ${svgPath}`);
  return clientPath;
}

// Batch generate all van SVGs
export async function generateAllVanSVGs(): Promise<Record<VanSize, string>> {
  const vanSizes: VanSize[] = ["small", "medium", "large", "luton"];
  const results: Partial<Record<VanSize, string>> = {};
  
  for (const size of vanSizes) {
    results[size] = await generateVanSVG(size);
  }
  
  return results as Record<VanSize, string>;
}

// Batch generate common service SVGs
export async function generateCommonServiceSVGs(): Promise<Record<string, string>> {
  const services = [
    "House Removals",
    "Office Relocations", 
    "Student Moves",
    "Furniture Delivery",
    "IKEA Collection"
  ];
  
  const results: Record<string, string> = {};
  
  for (const service of services) {
    const serviceKey = service.toLowerCase().replace(/\\s+/g, '-');
    results[serviceKey] = await generateServiceSVG(service);
  }
  
  return results;
}

// SVG generation functions for each van type
function generateSmallVanSVG(): string {
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <title>Small Transit Van</title>
    <defs>
      <linearGradient id="vanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="100%" stop-color="#e0e0e0" stop-opacity="1" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3" />
      </filter>
    </defs>
    <g transform="translate(100, 200)">
      <rect x="100" y="50" width="500" height="200" rx="20" fill="url(#vanGradient)" filter="url(#shadow)" />
      <path d="M100,150 L50,200 L50,250 L600,250 L600,150 L550,50 L100,50 Z" fill="#f5f5f5" stroke="#333" stroke-width="2" />
      <rect x="530" y="100" width="70" height="120" fill="#333" opacity="0.8" />
      <circle cx="150" cy="250" r="40" fill="#333" />
      <circle cx="150" cy="250" r="25" fill="#777" />
      <circle cx="150" cy="250" r="15" fill="#444" />
      <circle cx="450" cy="250" r="40" fill="#333" />
      <circle cx="450" cy="250" r="25" fill="#777" />
      <circle cx="450" cy="250" r="15" fill="#444" />
      <rect x="120" y="100" width="80" height="60" rx="5" fill="#4c85c0" fill-opacity="0.7" />
      <text x="300" y="150" font-family="Arial" font-size="32" text-anchor="middle" fill="#3366cc" font-weight="bold">Small Van</text>
      <text x="300" y="180" font-family="Arial" font-size="18" text-anchor="middle" fill="#666">Perfect for small moves</text>
    </g>
  </svg>`;
}

function generateMediumVanSVG(): string {
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <title>Medium Transit Van</title>
    <defs>
      <linearGradient id="vanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="100%" stop-color="#e0e0e0" stop-opacity="1" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3" />
      </filter>
    </defs>
    <g transform="translate(100, 200)">
      <rect x="50" y="50" width="600" height="200" rx="20" fill="url(#vanGradient)" filter="url(#shadow)" />
      <path d="M50,150 L10,200 L10,250 L650,250 L650,150 L600,50 L50,50 Z" fill="#f5f5f5" stroke="#333" stroke-width="2" />
      <rect x="580" y="100" width="70" height="120" fill="#333" opacity="0.8" />
      <circle cx="150" cy="250" r="40" fill="#333" />
      <circle cx="150" cy="250" r="25" fill="#777" />
      <circle cx="150" cy="250" r="15" fill="#444" />
      <circle cx="500" cy="250" r="40" fill="#333" />
      <circle cx="500" cy="250" r="25" fill="#777" />
      <circle cx="500" cy="250" r="15" fill="#444" />
      <rect x="120" y="100" width="80" height="60" rx="5" fill="#4c85c0" fill-opacity="0.7" />
      <rect x="300" y="100" width="120" height="120" rx="5" fill="#333" opacity="0.7" />
      <text x="350" y="150" font-family="Arial" font-size="32" text-anchor="middle" fill="#3366cc" font-weight="bold">Medium Van</text>
      <text x="350" y="180" font-family="Arial" font-size="18" text-anchor="middle" fill="#666">Ideal for most moves</text>
    </g>
  </svg>`;
}

function generateLargeVanSVG(): string {
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <title>Large Transit Van</title>
    <defs>
      <linearGradient id="vanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="100%" stop-color="#e0e0e0" stop-opacity="1" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3" />
      </filter>
    </defs>
    <g transform="translate(50, 200)">
      <rect x="10" y="30" width="700" height="220" rx="20" fill="url(#vanGradient)" filter="url(#shadow)" />
      <path d="M10,150 L0,200 L0,250 L710,250 L710,150 L650,30 L10,30 Z" fill="#f5f5f5" stroke="#333" stroke-width="2" />
      <rect x="650" y="80" width="60" height="140" fill="#333" opacity="0.8" />
      <circle cx="150" cy="250" r="40" fill="#333" />
      <circle cx="150" cy="250" r="25" fill="#777" />
      <circle cx="150" cy="250" r="15" fill="#444" />
      <circle cx="550" cy="250" r="40" fill="#333" />
      <circle cx="550" cy="250" r="25" fill="#777" />
      <circle cx="550" cy="250" r="15" fill="#444" />
      <rect x="120" y="80" width="80" height="60" rx="5" fill="#4c85c0" fill-opacity="0.7" />
      <rect x="250" y="80" width="140" height="140" rx="5" fill="#333" opacity="0.7" />
      <rect x="450" y="80" width="60" height="140" rx="5" fill="#333" opacity="0.7" />
      <text x="350" y="130" font-family="Arial" font-size="36" text-anchor="middle" fill="#3366cc" font-weight="bold">Large Van</text>
      <text x="350" y="170" font-family="Arial" font-size="20" text-anchor="middle" fill="#666">Perfect for larger moves</text>
    </g>
  </svg>`;
}

function generateLutonVanSVG(): string {
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <title>Luton Van</title>
    <defs>
      <linearGradient id="vanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="100%" stop-color="#e0e0e0" stop-opacity="1" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3" />
      </filter>
    </defs>
    <g transform="translate(50, 150)">
      <rect x="120" y="30" width="400" height="170" rx="5" fill="url(#vanGradient)" filter="url(#shadow)" />
      <rect x="0" y="200" width="700" height="70" rx="10" fill="#ffffff" stroke="#333" stroke-width="2" />
      <rect x="520" y="30" width="180" height="170" rx="5" fill="url(#vanGradient)" filter="url(#shadow)" />
      <rect x="100" y="140" width="120" height="60" rx="5" fill="#4c85c0" fill-opacity="0.7" />
      <circle cx="150" cy="270" r="40" fill="#333" />
      <circle cx="150" cy="270" r="25" fill="#777" />
      <circle cx="150" cy="270" r="15" fill="#444" />
      <circle cx="550" cy="270" r="40" fill="#333" />
      <circle cx="550" cy="270" r="25" fill="#777" />
      <circle cx="550" cy="270" r="15" fill="#444" />
      <rect x="300" y="220" width="100" height="50" fill="#999" />
      <path d="M300,220 L400,220 L400,270 L300,270 Z" fill="#555" />
      <text x="350" y="100" font-family="Arial" font-size="36" text-anchor="middle" fill="#3366cc" font-weight="bold">Luton Van</text>
      <text x="350" y="140" font-family="Arial" font-size="20" text-anchor="middle" fill="#666">Maximum space with tail lift</text>
    </g>
  </svg>`;
}

// Service SVG generators
function generateHouseRemovalsSVG(): string {
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <title>House Removals</title>
    <defs>
      <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#a1d0ff" stop-opacity="1" />
        <stop offset="100%" stop-color="#e6f2ff" stop-opacity="1" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3" />
      </filter>
    </defs>
    <rect x="0" y="0" width="800" height="600" fill="url(#skyGradient)" />
    <rect x="50" y="300" width="700" height="300" fill="#7fba67" />
    
    <!-- House -->
    <path d="M100,300 L100,120 L400,50 L700,120 L700,300 Z" fill="#f5f5f5" stroke="#333" stroke-width="2" filter="url(#shadow)" />
    <rect x="150" y="180" width="100" height="120" fill="#e09a4c" />
    <rect x="400" y="150" width="150" height="150" fill="#4c85c0" fill-opacity="0.7" />
    <path d="M400,50 L400,300" stroke="#555" stroke-width="3" />
    
    <!-- Van -->
    <rect x="500" y="340" width="200" height="100" rx="10" fill="#ffffff" stroke="#333" stroke-width="2" filter="url(#shadow)" />
    <rect x="550" y="370" width="100" height="40" fill="#4c85c0" fill-opacity="0.7" />
    <circle cx="540" cy="440" r="20" fill="#333" />
    <circle cx="540" cy="440" r="12" fill="#777" />
    <circle cx="660" cy="440" r="20" fill="#333" />
    <circle cx="660" cy="440" r="12" fill="#777" />
    
    <!-- Moving boxes -->
    <rect x="150" y="330" width="50" height="40" fill="#d7b78f" stroke="#a87c4f" stroke-width="2" />
    <rect x="170" y="290" width="60" height="40" fill="#d7b78f" stroke="#a87c4f" stroke-width="2" />
    <rect x="240" y="310" width="70" height="60" fill="#d7b78f" stroke="#a87c4f" stroke-width="2" />
    
    <!-- Text -->
    <text x="400" y="470" font-family="Arial" font-size="40" text-anchor="middle" fill="#333" font-weight="bold">House Removals</text>
    <text x="400" y="510" font-family="Arial" font-size="20" text-anchor="middle" fill="#333">Professional and reliable service</text>
  </svg>`;
}

function generateOfficeRelocationsSVG(): string {
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <title>Office Relocations</title>
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f0f0f0" stop-opacity="1" />
        <stop offset="100%" stop-color="#d0d0d0" stop-opacity="1" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3" />
      </filter>
    </defs>
    <rect x="0" y="0" width="800" height="600" fill="url(#bgGradient)" />
    
    <!-- Office Building -->
    <rect x="100" y="50" width="600" height="350" fill="#e6e6e6" stroke="#999" stroke-width="2" filter="url(#shadow)" />
    <rect x="150" y="100" width="100" height="80" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="300" y="100" width="100" height="80" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="450" y="100" width="100" height="80" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="150" y="220" width="100" height="80" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="300" y="220" width="100" height="80" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="450" y="220" width="100" height="80" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="320" y="350" width="160" height="50" fill="#333" />
    
    <!-- Van -->
    <rect x="200" y="450" width="250" height="100" rx="10" fill="#ffffff" stroke="#333" stroke-width="2" filter="url(#shadow)" />
    <rect x="250" y="480" width="150" height="40" fill="#4c85c0" fill-opacity="0.7" />
    <circle cx="240" cy="550" r="25" fill="#333" />
    <circle cx="240" cy="550" r="15" fill="#777" />
    <circle cx="410" cy="550" r="25" fill="#333" />
    <circle cx="410" cy="550" r="15" fill="#777" />
    
    <!-- Office Furniture -->
    <rect x="500" y="460" width="60" height="90" fill="#7a5230" stroke="#5a3d20" stroke-width="2" />
    <rect x="580" y="480" width="70" height="70" fill="#333" stroke="#222" stroke-width="2" />
    <rect x="570" y="520" width="90" height="30" fill="#aaa" stroke="#888" stroke-width="1" />
    
    <!-- Text -->
    <text x="400" y="420" font-family="Arial" font-size="40" text-anchor="middle" fill="#333" font-weight="bold">Office Relocations</text>
    <text x="400" y="580" font-family="Arial" font-size="20" text-anchor="middle" fill="#333">Minimize downtime with our expert service</text>
  </svg>`;
}

function generateStudentMovesSVG(): string {
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <title>Student Moves</title>
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f5f7fa" stop-opacity="1" />
        <stop offset="100%" stop-color="#e0e4e8" stop-opacity="1" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3" />
      </filter>
    </defs>
    <rect x="0" y="0" width="800" height="600" fill="url(#bgGradient)" />
    
    <!-- Student Housing -->
    <rect x="50" y="100" width="300" height="300" fill="#f0f0f0" stroke="#888" stroke-width="2" filter="url(#shadow)" />
    <rect x="100" y="150" width="80" height="60" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="220" y="150" width="80" height="60" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="100" y="250" width="80" height="60" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="220" y="250" width="80" height="60" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="160" y="350" width="80" height="50" fill="#555" />
    
    <!-- Campus Building -->
    <rect x="450" y="100" width="300" height="300" fill="#e6e6e6" stroke="#999" stroke-width="2" filter="url(#shadow)" />
    <path d="M450,100 L600,50 L750,100 Z" fill="#d0d0d0" stroke="#888" stroke-width="2" />
    <rect x="500" y="150" width="80" height="60" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="620" y="150" width="80" height="60" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="500" y="250" width="80" height="60" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="620" y="250" width="80" height="60" fill="#4c85c0" fill-opacity="0.7" />
    <rect x="560" y="350" width="80" height="50" fill="#555" />
    
    <!-- Van -->
    <rect x="275" y="450" width="250" height="100" rx="10" fill="#ffffff" stroke="#333" stroke-width="2" filter="url(#shadow)" />
    <rect x="325" y="480" width="150" height="40" fill="#4c85c0" fill-opacity="0.7" />
    <circle cx="315" cy="550" r="25" fill="#333" />
    <circle cx="315" cy="550" r="15" fill="#777" />
    <circle cx="485" cy="550" r="25" fill="#333" />
    <circle cx="485" cy="550" r="15" fill="#777" />
    
    <!-- Student Items -->
    <rect x="125" y="450" width="40" height="70" fill="#7a5230" stroke="#5a3d20" stroke-width="2" />
    <rect x="180" y="450" width="60" height="40" fill="#3366cc" stroke="#224488" stroke-width="2" />
    <rect x="180" y="500" width="40" height="30" fill="#cc6633" stroke="#884422" stroke-width="2" />
    <rect x="600" y="470" width="50" height="80" fill="#333" stroke="#222" stroke-width="2" />
    <rect x="670" y="490" width="30" height="60" fill="#555" stroke="#333" stroke-width="1" />
    
    <!-- Text -->
    <text x="400" y="420" font-family="Arial" font-size="40" text-anchor="middle" fill="#3366cc" font-weight="bold">Student Moves</text>
    <text x="400" y="580" font-family="Arial" font-size="20" text-anchor="middle" fill="#555">Affordable and flexible relocation</text>
  </svg>`;
}

function generateFurnitureDeliverySVG(): string {
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <title>Furniture Delivery</title>
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fafafa" stop-opacity="1" />
        <stop offset="100%" stop-color="#f0f0f0" stop-opacity="1" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3" />
      </filter>
    </defs>
    <rect x="0" y="0" width="800" height="600" fill="url(#bgGradient)" />
    
    <!-- Van -->
    <rect x="100" y="300" width="300" height="120" rx="10" fill="#ffffff" stroke="#333" stroke-width="2" filter="url(#shadow)" />
    <rect x="150" y="330" width="200" height="50" fill="#4c85c0" fill-opacity="0.7" />
    <circle cx="150" cy="420" r="30" fill="#333" />
    <circle cx="150" cy="420" r="18" fill="#777" />
    <circle cx="350" cy="420" r="30" fill="#333" />
    <circle cx="350" cy="420" r="18" fill="#777" />
    
    <!-- Furniture -->
    <rect x="450" y="220" width="100" height="200" fill="#7a5230" stroke="#5a3d20" stroke-width="3" filter="url(#shadow)" />
    <rect x="460" y="230" width="80" height="60" fill="#8b6b43" stroke="#5a3d20" stroke-width="1" />
    <rect x="460" y="300" width="80" height="60" fill="#8b6b43" stroke="#5a3d20" stroke-width="1" />
    <rect x="460" y="370" width="80" height="40" fill="#8b6b43" stroke="#5a3d20" stroke-width="1" />
    
    <!-- Chair -->
    <rect x="600" y="320" width="60" height="10" fill="#7a5230" stroke="#5a3d20" stroke-width="2" />
    <rect x="600" y="330" width="60" height="40" fill="#8b6b43" stroke="#5a3d20" stroke-width="2" />
    <rect x="605" y="370" width="10" height="50" fill="#7a5230" stroke="#5a3d20" stroke-width="1" />
    <rect x="645" y="370" width="10" height="50" fill="#7a5230" stroke="#5a3d20" stroke-width="1" />
    <path d="M595,320 L605,280 L655,280 L665,320 Z" fill="#7a5230" stroke="#5a3d20" stroke-width="2" />
    
    <!-- Table -->
    <rect x="580" y="430" width="100" height="10" fill="#7a5230" stroke="#5a3d20" stroke-width="2" />
    <rect x="590" y="440" width="10" height="40" fill="#7a5230" stroke="#5a3d20" stroke-width="1" />
    <rect x="660" y="440" width="10" height="40" fill="#7a5230" stroke="#5a3d20" stroke-width="1" />
    
    <!-- Mover -->
    <circle cx="500" y="480" r="30" fill="#f0d0a0" />
    <rect x="480" y="510" width="40" height="60" fill="#3366cc" />
    <rect x="470" y="510" width="10" height="40" fill="#f0d0a0" />
    <rect x="520" y="510" width="10" height="40" fill="#f0d0a0" />
    <rect x="485" y="570" width="15" height="30" fill="#555" />
    <rect x="505" y="570" width="15" height="30" fill="#555" />
    
    <!-- Text -->
    <text x="400" y="150" font-family="Arial" font-size="40" text-anchor="middle" fill="#3366cc" font-weight="bold">Furniture Delivery</text>
    <text x="400" y="200" font-family="Arial" font-size="20" text-anchor="middle" fill="#555">Safe and secure transport for your furniture</text>
  </svg>`;
}

function generateIkeaCollectionSVG(): string {
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <title>IKEA Collection</title>
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="100%" stop-color="#f0f0f0" stop-opacity="1" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3" />
      </filter>
    </defs>
    <rect x="0" y="0" width="800" height="600" fill="url(#bgGradient)" />
    
    <!-- IKEA Store -->
    <rect x="50" y="100" width="300" height="200" fill="#005ea8" stroke="#004c87" stroke-width="3" filter="url(#shadow)" />
    <rect x="80" y="130" width="240" height="140" fill="#ffda1a" />
    <text x="200" y="210" font-family="Arial" font-size="50" text-anchor="middle" fill="#005ea8" font-weight="bold">IKEA</text>
    
    <!-- Flat Packs -->
    <rect x="400" y="150" width="120" height="80" fill="#f0d0a0" stroke="#d0b080" stroke-width="2" />
    <rect x="410" y="160" width="100" height="60" fill="#e0c090" stroke="#d0b080" stroke-width="1" />
    <rect x="450" y="160" width="20" height="60" fill="#d0b080" stroke="#c0a070" stroke-width="1" />
    
    <rect x="400" y="250" width="150" height="20" fill="#f0d0a0" stroke="#d0b080" stroke-width="2" />
    <rect x="400" y="270" width="150" height="60" fill="#e0c090" stroke="#d0b080" stroke-width="1" />
    
    <rect x="580" y="200" width="180" height="10" fill="#f0d0a0" stroke="#d0b080" stroke-width="2" />
    <rect x="580" y="210" width="180" height="100" fill="#e0c090" stroke="#d0b080" stroke-width="1" />
    <line x1="620" y1="210" x2="620" y2="310" stroke="#d0b080" stroke-width="2" />
    <line x1="720" y1="210" x2="720" y2="310" stroke="#d0b080" stroke-width="2" />
    
    <!-- Van -->
    <rect x="220" y="400" width="360" height="150" rx="10" fill="#ffffff" stroke="#333" stroke-width="2" filter="url(#shadow)" />
    <rect x="250" y="440" width="300" height="60" fill="#4c85c0" fill-opacity="0.7" />
    <circle cx="280" cy="550" r="35" fill="#333" />
    <circle cx="280" cy="550" r="20" fill="#777" />
    <circle cx="520" cy="550" r="35" fill="#333" />
    <circle cx="520" cy="550" r="20" fill="#777" />
    
    <!-- Text -->
    <text x="400" y="360" font-family="Arial" font-size="40" text-anchor="middle" fill="#005ea8" font-weight="bold">IKEA Collection</text>
    <text x="400" y="570" font-family="Arial" font-size="20" text-anchor="middle" fill="#333" font-weight="bold">We collect it so you don't have to!</text>
  </svg>`;
}

function generateGenericServiceSVG(serviceName: string): string {
  return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <title>${serviceName}</title>
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="100%" stop-color="#f0f0f0" stop-opacity="1" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3" />
      </filter>
    </defs>
    <rect x="0" y="0" width="800" height="600" fill="url(#bgGradient)" />
    
    <!-- Van -->
    <rect x="200" y="250" width="400" height="150" rx="15" fill="#ffffff" stroke="#333" stroke-width="2" filter="url(#shadow)" />
    <rect x="250" y="300" width="300" height="60" fill="#4c85c0" fill-opacity="0.7" />
    <circle cx="280" cy="400" r="35" fill="#333" />
    <circle cx="280" cy="400" r="20" fill="#777" />
    <circle cx="520" cy="400" r="35" fill="#333" />
    <circle cx="520" cy="400" r="20" fill="#777" />
    
    <!-- Packages -->
    <rect x="100" y="450" width="80" height="60" fill="#d7b78f" stroke="#a87c4f" stroke-width="2" />
    <rect x="200" y="470" width="100" height="70" fill="#d7b78f" stroke="#a87c4f" stroke-width="2" />
    <rect x="500" y="460" width="120" height="80" fill="#d7b78f" stroke="#a87c4f" stroke-width="2" />
    <rect x="650" y="480" width="50" height="50" fill="#d7b78f" stroke="#a87c4f" stroke-width="2" />
    
    <!-- Text -->
    <text x="400" y="150" font-family="Arial" font-size="40" text-anchor="middle" fill="#3366cc" font-weight="bold">${serviceName}</text>
    <text x="400" y="200" font-family="Arial" font-size="20" text-anchor="middle" fill="#555">Professional and reliable service</text>
  </svg>`;
}

function generateHeroSectionSVG(): string {
  return `<svg width="1200" height="600" xmlns="http://www.w3.org/2000/svg">
    <title>Man and Van Hero</title>
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#3366cc" stop-opacity="1" />
        <stop offset="100%" stop-color="#1a3366" stop-opacity="1" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="3" dy="5" stdDeviation="6" flood-opacity="0.4" />
      </filter>
    </defs>
    <rect x="0" y="0" width="1200" height="600" fill="url(#bgGradient)" />
    
    <!-- City Skyline -->
    <path d="M0,400 L50,410 L100,400 L150,420 L200,410 L250,430 L300,415 L350,425 L400,400 L450,410 L500,405 L550,415 L600,400 L650,420 L700,410 L750,430 L800,415 L850,435 L900,410 L950,420 L1000,400 L1050,415 L1100,425 L1150,405 L1200,400 L1200,600 L0,600 Z" fill="#0a1a33" />
    
    <!-- Van -->
    <rect x="650" y="280" width="400" height="160" rx="20" fill="#ffffff" stroke="#333" stroke-width="3" filter="url(#shadow)" />
    <rect x="950" y="300" width="100" height="100" fill="#3366cc" fill-opacity="0.8" />
    <rect x="700" y="320" width="220" height="80" fill="#3366cc" fill-opacity="0.7" />
    <circle cx="750" cy="440" r="40" fill="#333" />
    <circle cx="750" cy="440" r="25" fill="#777" />
    <circle cx="750" cy="440" r="10" fill="#333" />
    <circle cx="950" cy="440" r="40" fill="#333" />
    <circle cx="950" cy="440" r="25" fill="#777" />
    <circle cx="950" cy="440" r="10" fill="#333" />
    
    <!-- Person -->
    <circle cx="500" y="350" r="50" fill="#f0d0a0" />
    <rect x="470" y="400" width="60" height="100" fill="#3366cc" />
    <rect x="450" y="400" width="20" height="70" fill="#f0d0a0" />
    <rect x="530" y="400" width="20" height="70" fill="#f0d0a0" />
    <rect x="475" y="500" width="25" height="60" fill="#1a3366" />
    <rect x="505" y="500" width="25" height="60" fill="#1a3366" />
    
    <!-- Moving Boxes -->
    <rect x="150" y="360" width="120" height="100" fill="#d7b78f" stroke="#a87c4f" stroke-width="3" filter="url(#shadow)" />
    <rect x="200" y="300" width="100" height="80" fill="#d7b78f" stroke="#a87c4f" stroke-width="3" filter="url(#shadow)" />
    <rect x="250" y="240" width="80" height="60" fill="#d7b78f" stroke="#a87c4f" stroke-width="3" filter="url(#shadow)" />
    
    <!-- Furniture -->
    <rect x="350" y="420" width="80" height="140" fill="#7a5230" stroke="#5a3d20" stroke-width="3" filter="url(#shadow)" />
    <rect x="360" y="430" width="60" height="40" fill="#8b6b43" stroke="#5a3d20" stroke-width="1" />
    <rect x="360" y="480" width="60" height="30" fill="#8b6b43" stroke="#5a3d20" stroke-width="1" />
    <rect x="360" y="520" width="60" height="30" fill="#8b6b43" stroke="#5a3d20" stroke-width="1" />
    
    <!-- Text -->
    <text x="600" y="150" font-family="Arial" font-size="60" text-anchor="middle" fill="#ffffff" font-weight="bold" filter="url(#shadow)">EasyMove</text>
    <text x="600" y="220" font-family="Arial" font-size="30" text-anchor="middle" fill="#ffffff" font-weight="bold">Professional Man and Van Services</text>
  </svg>`;
}