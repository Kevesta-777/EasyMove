export interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: {
    accuracy?: string;
    address?: string;
    category?: string;
    wikidata?: string;
    landmark?: boolean;
    maki?: string;
  };
  text: string;
  place_name: string;
  center: [number, number];
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  context?: {
    id: string;
    text: string;
    wikidata?: string;
  }[];
}

export interface MapboxSearchResponse {
  type: string;
  query: string[];
  features: MapboxFeature[];
  attribution: string;
}

export interface SearchResult {
  id: string;
  text: string;
  placeName: string;
  coordinates: [number, number];
  placeType: string[];
}
