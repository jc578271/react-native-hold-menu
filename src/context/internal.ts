import { createContext } from 'react';
import {SharedValue} from "react-native-reanimated";
import {TransformOriginAnchorPosition} from "../utils/calculations";

export type InternalContextType = {
  currentId: SharedValue<string|undefined>;
  activeId: SharedValue<string|undefined>;
  itemRectY: SharedValue<number>;
  itemRectX: SharedValue<number>;
  itemRectWidth: SharedValue<number>;
  itemRectHeight: SharedValue<number>;
  itemScale: SharedValue<number>;
  transformOrigin: SharedValue<TransformOriginAnchorPosition>;
  menuHeight: SharedValue<number>;
  menuWidth: SharedValue<number>;
};

// @ts-ignore
export const InternalContext = createContext<InternalContextType>();
