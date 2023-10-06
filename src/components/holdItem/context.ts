import { createContext, useContext } from "react";
import { SharedValue } from "react-native-reanimated";
import { TransformOriginAnchorPosition } from "../../utils/calculations";

interface HoldItemContextType {
  currentId: SharedValue<string|undefined>;
  itemRectY:SharedValue<number>,
  itemRectX:SharedValue<number>,
  itemRectWidth:SharedValue<number>,
  itemRectHeight:SharedValue<number>,
  itemScale:SharedValue<number>,
  transformValue:SharedValue<number>,
  transformOrigin:SharedValue<TransformOriginAnchorPosition>,
  menuHeight:SharedValue<number>,
  visible:SharedValue<boolean>,
  animatedActiveId: SharedValue<string|undefined>
}

//@ts-ignore
export const HoldItemContext = createContext<HoldItemContextType>()
export const useHoldItem = () => useContext(HoldItemContext)
