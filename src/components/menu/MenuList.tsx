import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';

import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { menuAnimationAnchor } from '../../utils/calculations';

import {
  HOLD_ITEM_TRANSFORM_DURATION,
  SPRING_CONFIGURATION_MENU,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../../constants';

import styles from './styles';
import { leftOrRight } from './calculations';
import { MenuProps } from './Menu';
import { useDeviceOrientation } from '../../hooks';

const MenuListComponent = ({
  menuAnchorPosition,
  children,
  currentId,
  name,
  itemRectWidth,
  menuHeight,
  menuWidth,
  itemRectX,
  safeAreaInsets,
  isFullScreenMenu,
}: MenuProps) => {
  const deviceOrientation = useDeviceOrientation();

  /* calculate translate X when menu is outside screen*/
  const caculateTransX = useCallback(
    (leftPos: number) => {
      'worklet';
      const anchorPositionHorizontal = menuAnchorPosition.split('-')[1];

      const windowWidth =
        deviceOrientation === 'portrait' ? WINDOW_WIDTH : WINDOW_HEIGHT;

      let x = 0;
      const r = itemRectX.value + leftPos + menuWidth.value;
      const l = itemRectX.value + leftPos;

      const extraRight = safeAreaInsets?.right || 0;
      const extraLeft = safeAreaInsets?.left || 0;

      if (anchorPositionHorizontal === 'right') {
        if (l < extraLeft) x = -l + extraLeft;
        if (r > windowWidth - extraRight) x = windowWidth - extraRight - r;
      } else {
        if (r > windowWidth - extraRight) x = windowWidth - extraRight - r;
        if (l < extraLeft) x = -l + extraLeft;
      }

      return x;
    },
    [menuAnchorPosition, safeAreaInsets, deviceOrientation]
  );

  const messageStyles = useAnimatedStyle(() => {
    const windowWidth =
      deviceOrientation === 'portrait' ? WINDOW_WIDTH : WINDOW_HEIGHT;

    const translate = menuAnimationAnchor(
      menuAnchorPosition,
      isFullScreenMenu ? windowWidth : itemRectWidth.value,
      menuHeight.value,
      menuWidth.value
    );

    const _leftPosition = leftOrRight(
      menuAnchorPosition,
      isFullScreenMenu ? windowWidth : itemRectWidth.value,
      menuWidth.value
    );

    const menuScaleAnimation = () =>
      currentId.value === name
        ? withSpring(1, SPRING_CONFIGURATION_MENU)
        : withTiming(0, {
            duration: HOLD_ITEM_TRANSFORM_DURATION,
          });

    const opacityAnimation = () =>
      withTiming(currentId.value === name ? 1 : 0, {
        duration: HOLD_ITEM_TRANSFORM_DURATION,
      });

    const translateX = caculateTransX(_leftPosition);

    return {
      left: _leftPosition,
      height: menuHeight.value,
      width: menuWidth.value,
      opacity: opacityAnimation(),
      transform: [
        // { translateX: translate.beginningTransformations.translateX },
        { translateX: isFullScreenMenu ? 0 : translateX },
        { translateY: translate.beginningTransformations.translateY },
        {
          scale: menuScaleAnimation(),
        },
        // { translateX: translate.endingTransformations.translateX },
        { translateY: translate.endingTransformations.translateY },
      ],
    };
  }, [deviceOrientation, isFullScreenMenu]);

  return (
    <Animated.View style={[styles.menuContainer, messageStyles]}>
      <Animated.View
        style={[StyleSheet.absoluteFillObject, _styles.menuContent]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
};

const _styles = StyleSheet.create({
  menuContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const MenuList = React.memo(MenuListComponent);

export default MenuList;
