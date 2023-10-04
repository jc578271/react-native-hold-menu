import { createContext, useContext } from "react";
import Animated, { AnimatedRef, SharedValue } from "react-native-reanimated";
import { TransformOriginAnchorPosition } from "../../utils/calculations";
import { HoldItemProviderProps } from "./types";

interface HoldItemContextTypes extends Omit<HoldItemProviderProps, "children">{
  isActive: SharedValue<boolean>
  isAnimationStarted: SharedValue<boolean>,
  itemRectY: SharedValue<number>,
  itemRectX: SharedValue<number>,
  itemRectWidth: SharedValue<number>,
  itemRectHeight: SharedValue<number>,
  itemScale: SharedValue<number>,
  transformValue: SharedValue<number>,
  menuHeight: SharedValue<number>,
  transformOrigin: SharedValue<TransformOriginAnchorPosition>;
  present: (isTap?: boolean) => void;
  containerRef:  AnimatedRef<Animated.View>;
}
//@ts-ignore
export const HoldItemContext = createContext<HoldItemContextTypes>();
export const useHoldItem = () => useContext<HoldItemContextTypes>(HoldItemContext)
