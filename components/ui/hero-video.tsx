import { useEventListener } from "expo";
import { useFocusEffect } from "expo-router";
import { useVideoPlayer, VideoView, type VideoSource } from "expo-video";
import { useCallback, useRef, type ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { PhotoPlaceholder } from "@/components/ui/photo-placeholder";

type HeroVideoProps = {
  video: VideoSource;
  // Shown while the video loads, if it fails, and for people who turn off motion.
  poster: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

// A silent, looping background clip with a photo behind it.
export function HeroVideo({ video, poster, accessibilityLabel, style, children }: HeroVideoProps) {
  const reduceMotion = useReducedMotion();
  const isFocused = useRef(true);
  const player = useVideoPlayer(reduceMotion ? null : video, (player) => {
    player.muted = true;
    player.loop = true;
    // Don't pause the music someone is already listening to.
    player.audioMixingMode = "mixWithOthers";
    player.play();
  });

  // On web the first play() can fire before the clip has loaded, so try again once it's ready.
  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "readyToPlay" && isFocused.current && !player.playing) player.play();
  });

  // Pause while another screen covers this one, to save battery.
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      player.play();
      return () => {
        isFocused.current = false;
        player.pause();
      };
    }, [player]),
  );

  return (
    <PhotoPlaceholder accessibilityLabel={accessibilityLabel} source={poster} style={style}>
      {reduceMotion ? null : (
        <VideoView
          accessible={false}
          contentFit="cover"
          nativeControls={false}
          player={player}
          playsInline
          style={StyleSheet.absoluteFill}
        />
      )}
      {children}
    </PhotoPlaceholder>
  );
}
