import { ConvexHttpClient } from "convex/browser";

// created a singleton instance of the convexhttp client
export const getConvexClient = () => {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
};
