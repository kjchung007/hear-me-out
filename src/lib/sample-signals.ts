import type { Signal } from "./use-signals";
const examples = [
  ["kuching", "❤️", "A little less alone tonight"],
  ["kuching", "😴", "One more chapter…"],
  ["kuching", "😊", "Rain outside, warm tea inside"],
  ["kuching", "🤯", "Taking a tiny break"],
  ["tokyo", "😴", "Anyone else still awake?"],
  ["seoul", "❤️", "You did enough today"],
  ["sydney", "😊", "A good little day"],
  ["london", "😭", "Could use a hug"],
  ["new-york", "🤯", "So many tabs open"],
  ["sao-paulo", "❤️", "Sending a little kindness"],
  ["cape-town", "😊", "Hello, world"],
] as const;
export const sampleSignals: Signal[] = examples.map(
  ([city, emoji, text], i) => ({
    id: `sample-${city}-${i}`,
    displayName: i % 3 === 0 ? "Kai" : i % 3 === 1 ? "Luna" : null,
    city,
    emoji,
    text,
    expiresAt: Number.POSITIVE_INFINITY,
    reactions: 0,
    reacted: false,
    sample: true,
  }),
);
