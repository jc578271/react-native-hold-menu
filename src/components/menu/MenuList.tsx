import React from 'react';
import { StyleSheet } from 'react-native';

import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { menuAnimationAnchor } from '../../utils/calculations';

import {
  CONTEXT_MENU_STATE,
  HOLD_ITEM_TRANSFORM_DURATION,
  SPRING_CONFIGURATION_MENU,
} from '../../constants';

import styles from './styles';
import { leftOrRight } from './calculations';
import { MenuProps } from './Menu';

const MenuListComponent = ({
  menuAnchorPosition = 'top-left',
  children,
  state,
  itemRectWidth,
  menuHeight,
  menuWidth,
  currentId,
  id,
}: MenuProps) => {
  const messageStyles = useAnimatedStyle(() => {
    const translate = menuAnimationAnchor(
      menuAnchorPosition,
      itemRectWidth.value,
      menuHeight.value,
      menuWidth.value
    );

    const _leftPosition = leftOrRight(
      menuAnchorPosition,
      itemRectWidth.value,
      menuWidth.value
    );

    const isActive =
      id === undefined
        ? state.value === CONTEXT_MENU_STATE.ACTIVE
        : currentId.value === id;

    const menuScaleAnimation = () =>
      isActive
        ? withSpring(1, SPRING_CONFIGURATION_MENU)
        : withTiming(0, {
            duration: HOLD_ITEM_TRANSFORM_DURATION,
          });

    const opacityAnimation = () =>
      withTiming(isActive ? 1 : 0, {
        duration: HOLD_ITEM_TRANSFORM_DURATION,
      });

    return {
      left: _leftPosition,
      height: menuHeight.value,
      width: menuWidth.value,
      opacity: opacityAnimation(),
      transform: [
        { translateX: translate.beginningTransformations.translateX },
        { translateY: translate.beginningTransformations.translateY },
        {
          scale: menuScaleAnimation(),
        },
        { translateX: translate.endingTransformations.translateX },
        { translateY: translate.endingTransformations.translateY },
      ],
    };
  });

  return (
    <Animated.View
      //@ts-ignore
      style={[styles.menuContainer, messageStyles]}
    >
      <Animated.View
        //@ts-ignore
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
