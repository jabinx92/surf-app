import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";

// Where the subject sits in a photo or clip, as fractions of its width and height (0 = left/top, 1 = right/bottom).
export type Focus = { x: number; y: number };

const center: Focus = { x: 0.5, y: 0.5 };

// Plain absolute positioning, so it fits both image and video styles.
type CropStyle = { position: "absolute"; left: number; top: number; right?: number; bottom?: number; width?: number; height?: number };

const fill: CropStyle = { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Fills a frame like "cover", but slides the crop so the focus point stays as close to the middle as the edges allow.
export function useFocusCrop(aspect: number, focus: Focus = center) {
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setFrame((current) => (current && current.width === width && current.height === height ? current : { width, height }));
  }

  if (!frame || frame.width === 0 || frame.height === 0) {
    return { onLayout, style: fill };
  }

  const width = Math.max(frame.width, frame.height * aspect);
  const height = Math.max(frame.height, frame.width / aspect);
  const style: CropStyle = {
    position: "absolute",
    width,
    height,
    left: clamp(frame.width / 2 - focus.x * width, frame.width - width, 0),
    top: clamp(frame.height / 2 - focus.y * height, frame.height - height, 0),
  };
  return { onLayout, style };
}
