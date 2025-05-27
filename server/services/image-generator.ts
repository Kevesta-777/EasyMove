import fs from "fs";
import path from "path";
import { promisify } from "util";

// Define VanSize type
type VanSize = "small" | "medium" | "large" | "luton";

// Initialize OpenAI client only if API key is available
let openai: any = null;
if (process.env.OPENAI_API_KEY) {
  const { OpenAI } = require("openai");
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Convert fs functions to promises
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

// Directory for storing generated images
const IMAGE_DIR = path.join(process.cwd(), "client/src/assets/generated");

// Make sure the directory exists
async function ensureDirectoryExists() {
  try {
    await access(IMAGE_DIR);
  } catch (error) {
    await mkdir(IMAGE_DIR, { recursive: true });
  }
}

// Import the SVG generator functions
import { generateVanSVG, generateServiceSVG, generateHeroSVG } from "./svg-generator";

// Generate a van image based on size
export async function generateVanImage(vanSize: VanSize): Promise<string> {
  try {
    await ensureDirectoryExists();
    
    // If no OpenAI API, generate SVG instead
    if (!openai) {
      console.log("OpenAI API not available, using SVG generator");
      return await generateVanSVG(vanSize);
    }
    
    // Check if we already have this image
    const imagePath = path.join(IMAGE_DIR, `${vanSize}-van.png`);
    const clientPath = `/src/assets/generated/${vanSize}-van.png`;
    
    // Check if file already exists
    try {
      await access(imagePath);
      console.log(`Image for ${vanSize} van already exists`);
      return clientPath;
    } catch (error) {
      // File does not exist, generate it
      console.log(`Generating image for ${vanSize} van`);
    }
    
    let prompt = "";
    
    // Create detailed prompts based on van size
    switch (vanSize) {
      case "small":
        prompt = "A professional small transit van with doors open showing compact cargo space, clean white color, perfect for small moves, realistic photo, front 3/4 view";
        break;
      case "medium":
        prompt = "A medium-sized transit van with medium wheelbase, white with company branding, side view with doors open showing spacious cargo area, realistic photo";
        break;
      case "large":
        prompt = "A large professional long wheelbase transit van, white color, with side doors open to show spacious cargo area, realistic photo, side 3/4 view";
        break;
      case "luton":
        prompt = "A professional Luton van with box body and tail lift, perfect for house moves, white color with subtle branding, realistic photo showing large cargo space";
        break;
    }
    
    try {
      // Generate the image using OpenAI
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      });
      
      // Save the image
      if (response.data[0].b64_json) {
        const buffer = Buffer.from(response.data[0].b64_json, 'base64');
        await writeFile(imagePath, buffer);
        console.log(`Image for ${vanSize} van saved to ${imagePath}`);
        return clientPath;
      } else {
        throw new Error("No image data received from OpenAI");
      }
    } catch (openaiError) {
      console.error(`OpenAI image generation error: ${openaiError}`);
      // Fall back to SVG generation
      return await generateVanSVG(vanSize);
    }
  } catch (error) {
    console.error(`Error generating van image: ${error}`);
    // Return a default SVG path if all methods fail
    return await generateVanSVG(vanSize);
  }
}

// Generate service-related images
export async function generateServiceImage(service: string): Promise<string> {
  try {
    await ensureDirectoryExists();
    
    // Convert service name to a file-friendly format
    const serviceKey = service.toLowerCase().replace(/\s+/g, '-');
    
    // If no OpenAI API, generate SVG instead
    if (!openai) {
      console.log("OpenAI API not available, using SVG generator for service");
      return await generateServiceSVG(service);
    }
    
    // Check if we already have this image
    const imagePath = path.join(IMAGE_DIR, `${serviceKey}.png`);
    const clientPath = `/src/assets/generated/${serviceKey}.png`;
    
    // Check if file already exists
    try {
      await access(imagePath);
      console.log(`Image for ${service} already exists`);
      return clientPath;
    } catch (error) {
      // File does not exist, generate it
      console.log(`Generating image for ${service}`);
    }
    
    let prompt = `A professional man and van service showing ${service}, realistic photograph, clean and professional`;
    
    try {
      // Generate the image using OpenAI
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      });
      
      // Save the image
      if (response.data[0].b64_json) {
        const buffer = Buffer.from(response.data[0].b64_json, 'base64');
        await writeFile(imagePath, buffer);
        console.log(`Image for ${service} saved to ${imagePath}`);
        return clientPath;
      } else {
        throw new Error("No image data received from OpenAI");
      }
    } catch (openaiError) {
      console.error(`OpenAI service image generation error: ${openaiError}`);
      // Fall back to SVG generation
      return await generateServiceSVG(service);
    }
  } catch (error) {
    console.error(`Error generating service image: ${error}`);
    // Return a default SVG path if all methods fail
    return await generateServiceSVG(service);
  }
}

// Generate images for hero section or backgrounds
export async function generateHeroImage(description: string): Promise<string> {
  try {
    await ensureDirectoryExists();
    
    // If no OpenAI API, generate SVG instead
    if (!openai) {
      console.log("OpenAI API not available, using SVG generator for hero");
      return await generateHeroSVG(description);
    }
    
    // Generate a unique key for this hero image
    const heroKey = `hero-${Date.now()}`;
    
    // Image paths
    const imagePath = path.join(IMAGE_DIR, `${heroKey}.png`);
    const clientPath = `/src/assets/generated/${heroKey}.png`;
    
    // Create detailed prompt
    const prompt = `A professional moving service scene: ${description}, clean, high quality realistic photograph, ideal for a website hero section`;
    
    try {
      // Generate the image using OpenAI
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        response_format: "b64_json",
      });
      
      // Save the image
      if (response.data[0].b64_json) {
        const buffer = Buffer.from(response.data[0].b64_json, 'base64');
        await writeFile(imagePath, buffer);
        console.log(`Hero image saved to ${imagePath}`);
        return clientPath;
      } else {
        throw new Error("No image data received from OpenAI");
      }
    } catch (openaiError) {
      console.error(`OpenAI hero image generation error: ${openaiError}`);
      // Fall back to SVG generation
      return await generateHeroSVG(description);
    }
  } catch (error) {
    console.error(`Error generating hero image: ${error}`);
    // Return a default SVG path if all methods fail
    return await generateHeroSVG(description);
  }
}

// Batch generate all van images
export async function generateAllVanImages(): Promise<Record<VanSize, string>> {
  const vanSizes: VanSize[] = ["small", "medium", "large", "luton"];
  const results: Partial<Record<VanSize, string>> = {};
  
  for (const size of vanSizes) {
    results[size] = await generateVanImage(size);
  }
  
  return results as Record<VanSize, string>;
}

// Batch generate common service images
export async function generateCommonServiceImages(): Promise<Record<string, string>> {
  const services = [
    "House Removals",
    "Office Relocations", 
    "Student Moves",
    "Furniture Delivery",
    "IKEA Collection"
  ];
  
  const results: Record<string, string> = {};
  
  for (const service of services) {
    const serviceKey = service.toLowerCase().replace(/\s+/g, '-');
    results[serviceKey] = await generateServiceImage(service);
  }
  
  return results;
}