export const avatarColors = [
  { label: "Coral", value: "#f97066" },
  { label: "Orange", value: "#f79009" },
  { label: "Yellow", value: "#fdb022" },
  { label: "Green", value: "#32d583" },
  { label: "Teal", value: "#2ed3b7" },
  { label: "Blue", value: "#2e90fa" },
  { label: "Indigo", value: "#6172f3" },
  { label: "Purple", value: "#9b8afb" },
  { label: "Pink", value: "#ee46bc" },
  { label: "Red", value: "#f04438" },
] as const;

export const defaultAvatarColor = avatarColors[4].value;

export function getRandomAvatarColor() {
  return avatarColors[Math.floor(Math.random() * avatarColors.length)].value;
}
