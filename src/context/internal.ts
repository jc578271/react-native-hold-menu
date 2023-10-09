import { createContext } from 'react';
import { HoldItemContextType } from '../components/holdItem/context';
import { SharedValue } from 'react-native-reanimated';

export interface InternalContextType
  extends Omit<HoldItemContextType, 'state'> {
  currentId: SharedValue<string>;
  activeId: SharedValue<string>;
}

// @ts-ignore
export const InternalContext = createContext<InternalContextType>();
