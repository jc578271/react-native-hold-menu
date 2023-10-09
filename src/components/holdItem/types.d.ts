import { ViewStyle } from 'react-native';
import { TransformOriginAnchorPosition } from '../../utils/calculations';
import { SharedValue } from 'react-native-reanimated';

export type HoldItemProps = {
  name: string;
  children: React.ReactElement | React.ReactElement[];
  style?: ViewStyle | ViewStyle[];
  hasModal?: boolean;
};

export type GestureHandlerProps = {
  children: React.ReactElement | React.ReactElement[];
};

export type HoldItemPortalValue = {
  itemRectWidth: number;
  itemRectHeight: number;
  itemRectX: number;
  itemRectY: number;
  isActive: boolean;
  itemScale: number;
  transformOrigin: TransformOriginAnchorPosition;
};
