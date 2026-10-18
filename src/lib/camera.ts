export type PublicCamera = {
  id: string;
  title: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  image: string;
  player: string;
  detail: string;
  kind: "video" | "image" | "youtube";
  refresh: string;
  refreshMs: number;
};
