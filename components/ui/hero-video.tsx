import { useEventListener } from "expo";
import { useFocusEffect } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useRef, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { useFocusCrop } from "@/components/ui/focus-crop";
import { PhotoPlaceholder } from "@/components/ui/photo-placeholder";
import type { HeroMedia } from "@/constants/media";

// All our clips are exported at 16:9.
const videoAspect = 16 / 9;

type HeroVideoProps = {
  // The clip, plus a photo shown while it loads, if it fails, and for people who turn off motion.
  media: HeroMedia;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

// A silent, looping background clip with a photo behind it.
export function HeroVideo({ media, accessibilityLabel, style, children }: HeroVideoProps) {
  const reduceMotion = useReducedMotion();
  const isFocused = useRef(true);
  const crop = useFocusCrop(videoAspect, media.videoFocus);
  const player = useVideoPlayer(reduceMotion ? null : media.video, (player) => {
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
    <PhotoPlaceholder accessibilityLabel={accessibilityLabel} aspect={media.posterAspect} focus={media.posterFocus} source={media.poster} style={style}>
      {reduceMotion ? null : (
        <View onLayout={crop.onLayout} pointerEvents="none" style={StyleSheet.absoluteFill}>
          <VideoView accessible={false} contentFit="fill" nativeControls={false} player={player} playsInline style={crop.style} />
        </View>
      )}
      {children}
    </PhotoPlaceholder>
  );
}
