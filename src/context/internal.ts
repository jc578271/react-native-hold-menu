import React, { createContext } from 'react';
import { HoldItemContextType } from '../components/holdItem/context';
import { SharedValue } from 'react-native-reanimated';

export interface InternalContextType extends HoldItemContextType {
  currentId: SharedValue<string | undefined>;
  setRenderChildren: React.Dispatch<React.SetStateAction<JSX.Element | null>>;
  renderChildren: JSX.Element | null;
}

// @ts-ignore
export const InternalContext = createContext<InternalContextType>();
