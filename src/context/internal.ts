import { createContext } from 'react';

export type InternalContextType = {
  // state: Animated.SharedValue<CONTEXT_MENU_STATE>;
  // theme: Animated.SharedValue<'light' | 'dark'>;
  // safeAreaInsets?: {
  //   top: number;
  //   right: number;
  //   bottom: number;
  //   left: number;
  // };
};

// @ts-ignore
export const InternalContext = createContext<InternalContextType>();
