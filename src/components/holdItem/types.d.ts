import { ViewStyle } from 'react-native';
import { TransformOriginAnchorPosition } from '../../utils/calculations';
import { SharedValue } from 'react-native-reanimated';

export type HoldItemProps = {
  visible: SharedValue<boolean>;
  children: React.ReactElement | React.ReactElement[];

  /**
   * Disables moving holded item
   * @type boolean
   * @default false
   * @examples
   * disableMove={true}
   */
  disableMove?: boolean;

  /**
   * Menu anchor position is calculated automaticly.
   * But you can override the calculation by passing an anchor position.
   * @type TransformOriginAnchorPosition
   * @examples
   * menuAnchorPosition="top-bottom"
   */
  menuAnchorPosition?: TransformOriginAnchorPosition;

  /**
   * Set true if you want to open menu from bottom
   * @type boolean
   * @default false
   * @examples
   * bottom={true}
   */
  bottom?: boolean;
  MenuElement: JSX.Element;
  safeAreaInsets?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /**
   * HoldItem wrapper component styles.
   * You may need for some examples like dynamic width or hight like message boxes.
   * See Whatsapp example.
   * @type ViewStyles
   * @default {}
   * @examples
   * containerStyles={{ maxWidth: '80%' }}
   */
  style?: ViewStyle | ViewStyle[];
  isTap?: boolean;
  backdropOpacity?: number;
  CustomModalElement?: JSX.Element | null
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
