import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface ApiRequestOptions {
  method: string;
  url: string;
  data?: any;
  headers?: Record<string, string>;
}

export async function apiRequest<T = any>({
  method,
  url,
  data,
  headers = {}
}: ApiRequestOptions): Promise<T> {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...headers
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    
    // Handle possible non-JSON responses (especially for payment services like Stripe)
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json() as Promise<T>;
    }
    
    // For text responses or empty responses
    if (contentType && contentType.includes('text/')) {
      const text = await res.text();
      try {
        // Try to parse as JSON in case content-type header is wrong
        return JSON.parse(text) as T;
      } catch {
        // Return text response as is
        return text as unknown as T;
      }
    }
    
    // Default fallback to JSON
    return res.json() as Promise<T>;
  } catch (error) {
    console.error(`API Request failed for ${method} ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  route: string;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, route }) =>
  async ({ queryKey }) => {
    const res = await fetch(route, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
