import type { Focus } from "@/components/ui/focus-crop";

export type HeroMedia = {
  video: number;
  // Where the surfer rides across the whole clip, checked second by second.
  videoFocus: Focus;
  poster: number;
  posterAspect: number;
  posterFocus: Focus;
};

// Free Pexels stock for now; swap for WaveLens creators' work once they give permission. Sources in assets/CREDITS.md.
export const homeHeroMedia: HeroMedia = {
  video: require("@/assets/videos/home-hero.mp4"),
  videoFocus: { x: 0.75, y: 0.5 }, // rider carves from 58% to 92% across
  poster: require("@/assets/images/surf-water-level.jpg"),
  posterAspect: 2000 / 1526,
  posterFocus: { x: 0.46, y: 0.53 },
};

export const whyWaveLensMedia: HeroMedia = {
  video: require("@/assets/videos/why-wavelens.mp4"),
  videoFocus: { x: 0.45, y: 0.5 }, // rider stays between 34% and 56% across
  poster: require("@/assets/images/surf-trio-aerial.jpg"),
  posterAspect: 1,
  posterFocus: { x: 0.56, y: 0.46 }, // three surfers span 16% to 96% across
};

export const spotPickerMedia: HeroMedia = {
  video: require("@/assets/videos/golden-hour.mp4"),
  videoFocus: { x: 0.48, y: 0.5 }, // surfer at 40–50%, board spans 28–69%
  poster: require("@/assets/images/surf-paddle-aerial.jpg"),
  posterAspect: 1125 / 2000,
  posterFocus: { x: 0.5, y: 0.51 },
};
