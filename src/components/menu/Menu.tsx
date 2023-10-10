import React from 'react';

import Animated, {
  SharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import MenuList from './MenuList';

import styles from './styles';
import {
  HOLD_ITEM_TRANSFORM_DURATION,
  SPRING_CONFIGURATION,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../../constants';
import { TransformOriginAnchorPosition } from '../../utils/calculations';
import { useDeviceOrientation } from '../../hooks';

export interface MenuProps {
  name: string;
  menuAnchorPosition: TransformOriginAnchorPosition;
  children: any;
  currentId: SharedValue<string | undefined>;
  itemRectY: SharedValue<number>;
  itemRectX: SharedValue<number>;
  itemRectWidth: SharedValue<number>;
  itemRectHeight: SharedValue<number>;
  menuHeight: SharedValue<number>;
  menuWidth: SharedValue<number>;
  calculateTransformValue: () => number;
  safeAreaInsets?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  isFullScreenMenu?: boolean;
}

const MenuComponent = ({ children, ...rest }: MenuProps) => {
  const {
    name,
    menuAnchorPosition,
    currentId,
    itemRectX,
    itemRectY,
    itemRectHeight,
    itemRectWidth,
    calculateTransformValue,
    isFullScreenMenu,
  } = rest;

  const deviceOrientation = useDeviceOrientation();

  const wrapperStyles = useAnimatedStyle(() => {
    const anchorPositionVertical = menuAnchorPosition.split('-')[0];

    const windowWidth =
      deviceOrientation === 'portrait' ? WINDOW_WIDTH : WINDOW_HEIGHT;

    const top =
      anchorPositionVertical === 'top'
        ? itemRectHeight.value + itemRectY.value + 8
        : itemRectY.value - 8;
    const left = isFullScreenMenu ? 0 : itemRectX.value;
    const width = isFullScreenMenu ? windowWidth : itemRectWidth.value;
    const tY = calculateTransformValue();

    return {
      top,
      left,
      width,
      transform: [
        {
          translateY:
            currentId.value === name
              ? withSpring(tY, SPRING_CONFIGURATION)
              : withTiming(0, { duration: HOLD_ITEM_TRANSFORM_DURATION }),
        },
      ],
    };
  }, [deviceOrientation, isFullScreenMenu]);

  return (
    <Animated.View style={[styles.menuWrapper, wrapperStyles]}>
      <MenuList {...rest}>{children}</MenuList>
    </Animated.View>
  );
};

const Menu = React.memo(MenuComponent);

export default Menu;
