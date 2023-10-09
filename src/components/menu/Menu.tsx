import React from 'react';

import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import MenuList from './MenuList';

import styles from './styles';
import {
  HOLD_ITEM_TRANSFORM_DURATION,
  CONTEXT_MENU_STATE,
  SPRING_CONFIGURATION,
} from '../../constants';
import { calculateTransformValue } from '../../utils/calculateTransformValue';
import { useDeviceOrientation } from '../../hooks';
import { HoldItemContextType } from '../holdItem/context';
import {HoldItemPortalProps} from "../holdItem/HoldItemPortal";

export type MenuProps = Omit<HoldItemPortalProps, 'MenuElement'> &
  HoldItemContextType;

const MenuComponent = ({ children, ...rest }: MenuProps) => {
  const {
    menuAnchorPosition = 'top-left',
    state,
    itemRectX,
    itemRectY,
    itemRectHeight,
    itemRectWidth,
    transformOrigin,
    disableMove,
    menuHeight,
    safeAreaInsets,
  } = rest;
  const deviceOrientation = useDeviceOrientation();

  const wrapperStyles = useAnimatedStyle(() => {
    const anchorPositionVertical = menuAnchorPosition.split('-')[0];

    const top =
      anchorPositionVertical === 'top'
        ? itemRectHeight.value + itemRectY.value + 8
        : itemRectY.value - 8;
    const left = itemRectX.value;
    const width = itemRectWidth.value;
    const tY = calculateTransformValue({
      deviceOrientation,
      transformOrigin: transformOrigin.value,
      disableMove,
      itemRectY: itemRectY.value,
      itemRectHeight: itemRectHeight.value,
      menuHeight: menuHeight.value,
      safeAreaInsets,
    });

    return {
      top,
      left,
      width,
      transform: [
        {
          translateY:
            state.value === CONTEXT_MENU_STATE.ACTIVE
              ? withSpring(tY, SPRING_CONFIGURATION)
              : withTiming(0, { duration: HOLD_ITEM_TRANSFORM_DURATION }),
        },
      ],
    };
  });

  return (
    // @ts-ignore
    <Animated.View style={[styles.menuWrapper, wrapperStyles]}>
      <MenuList {...rest}>{children}</MenuList>
    </Animated.View>
  );
};

const Menu = React.memo(MenuComponent);

export default Menu;
