export const serviceOptions = ["Photography", "Video", "Drone"] as const;

export type CreatorService = (typeof serviceOptions)[number];

export type Creator = {
  id: string;
  owner_id?: string;
  display_name: string;
  city: string;
  services: CreatorService[];
  portfolio_url: string;
  portfolio_urls?: string[];
  starting_rate: number;
  bio: string;
  equipment_setup: string;
  travel_miles: number;
  avatar_url: string | null;
  avatar_color: string;
  is_verified: boolean;
  availability?: { weekday: number; start_time: string; end_time: string; surf_spot: string }[];
};

export function creatorTitle(services: CreatorService[]) {
  if (services.includes("Video")) {
    return services.includes("Photography") ? "Surf photographer and videographer" : "Surf videographer";
  }
  return "Surf photographer";
}

export function hourlyRate(creator: Pick<Creator, "starting_rate">) {
  return `$${creator.starting_rate}/hr`;
}
