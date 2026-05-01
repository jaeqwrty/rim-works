import stockRim from "@/assets/stock-rim.jpg";
import customRim1 from "@/assets/custom-rim-1.jpg";
import customRim2 from "@/assets/custom-rim-2.jpg";
import customRim3 from "@/assets/custom-rim-3.jpg";
import heroRim from "@/assets/hero-rim.jpg";

// Maps stored URL paths from the seed data to bundled assets.
// Admin-uploaded photos use Supabase Storage URLs (http...) and pass through.
const localMap: Record<string, string> = {
  "/assets/stock-rim.jpg": stockRim,
  "/assets/custom-rim-1.jpg": customRim1,
  "/assets/custom-rim-2.jpg": customRim2,
  "/assets/custom-rim-3.jpg": customRim3,
};

export const resolveImage = (url?: string | null): string => {
  if (!url) return stockRim;
  if (url.startsWith("http")) return url;
  return localMap[url] ?? stockRim;
};

export { heroRim, stockRim };
