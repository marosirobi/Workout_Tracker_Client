import { useRef, useState } from "react";
import type { GestureResponderEvent, View } from "react-native";

export function useChartScrub() {
  const containerRef = useRef<View>(null);
  const leftRef = useRef(0);
  const [touchX, setTouchX] = useState<number | null>(null);

  const measure = () => {
    containerRef.current?.measureInWindow((x) => {
      leftRef.current = x;
    });
  };

  const updateTouch = (event: GestureResponderEvent) => {
    setTouchX(event.nativeEvent.pageX - leftRef.current);
  };

  const scrubProps = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: updateTouch,
    onResponderMove: updateTouch,
    onResponderRelease: () => setTouchX(null),
    onResponderTerminate: () => setTouchX(null),
  };

  return { containerRef, measure, touchX, scrubProps };
}

export function findNearest<T>(
  items: T[],
  distance: (item: T) => number,
): T | null {
  let best: T | null = null;
  let bestDistance = Infinity;

  for (const item of items) {
    const d = distance(item);
    if (d < bestDistance) {
      best = item;
      bestDistance = d;
    }
  }
  return best;
}
