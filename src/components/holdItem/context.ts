import { createContext, useContext } from 'react';
import { SharedValue } from 'react-native-reanimated';
import { TransformOriginAnchorPosition } from '../../utils/calculations';
import { CONTEXT_MENU_STATE } from '../../constants';

export interface HoldItemContextType {
  itemRectY: SharedValue<number>;
  itemRectX: SharedValue<number>;
  itemRectWidth: SharedValue<number>;
  itemRectHeight: SharedValue<number>;
  itemScale: SharedValue<number>;
  transformOrigin: SharedValue<TransformOriginAnchorPosition>;
  menuHeight: SharedValue<number>;
  menuWidth: SharedValue<number>;
  state: SharedValue<CONTEXT_MENU_STATE>;
}

//@ts-ignore
export const HoldItemContext = createContext<HoldItemContextType>();
export const useHoldItem = () => useContext(HoldItemContext);
