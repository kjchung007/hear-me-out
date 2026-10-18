// Shared public city anchors. These are never device or individual post coordinates.
export const cities = [
  {
    id: "kuching",
    name: "Kuching",
    country: "Malaysia",
    lat: 1.55,
    lon: 110.34,
    zone: "Asia/Kuching",
  },
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    lat: 1.29027,
    lon: 103.85196,
    zone: "Asia/Singapore",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    lat: 35.68,
    lon: 139.69,
    zone: "Asia/Tokyo",
  },
  {
    id: "seoul",
    name: "Seoul",
    country: "South Korea",
    lat: 37.57,
    lon: 126.98,
    zone: "Asia/Seoul",
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "Australia",
    lat: -33.87,
    lon: 151.21,
    zone: "Australia/Sydney",
  },
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    lat: 51.51,
    lon: -0.13,
    zone: "Europe/London",
  },
  {
    id: "new-york",
    name: "New York",
    country: "United States",
    lat: 40.71,
    lon: -74.01,
    zone: "America/New_York",
  },
  {
    id: "sao-paulo",
    name: "São Paulo",
    country: "Brazil",
    lat: -23.55,
    lon: -46.63,
    zone: "America/Sao_Paulo",
  },
  {
    id: "cape-town",
    name: "Cape Town",
    country: "South Africa",
    lat: -33.92,
    lon: 18.42,
    zone: "Africa/Johannesburg",
  },
] as const;
export type City = (typeof cities)[number];
export const moods = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😭", label: "Having a hard day" },
  { emoji: "😴", label: "Sleepy" },
  { emoji: "❤️", label: "Loved" },
  { emoji: "😡", label: "Frustrated" },
  { emoji: "🤯", label: "Overwhelmed" },
];
export const EXPIRY_MS = 60 * 60 * 1000;
export function characterCount(text: string) {
  // Match PostgreSQL char_length so the browser and database enforce the same limit.
  return Array.from(text).length;
}
