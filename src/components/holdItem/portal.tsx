import React, { memo, useCallback, useMemo } from 'react';
import { useInternal } from '../../hooks';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  HOLD_ITEM_TRANSFORM_DURATION,
  SPRING_CONFIGURATION,
} from '../../constants';
import { LayoutChangeEvent, StyleSheet, View, ViewProps } from 'react-native';
import styles from './styles';
import { Portal } from '@gorhom/portal';
import Menu from '../menu';
import { Backdrop } from '../backdrop';
import { HoldItemModalProps } from 'react-native-hold-menu';

export const HoldItemPortal = memo(function _HoldItemPortal({
  name,
  children,
  disableMove,
  menuAnchorPosition,
  MenuElement,
  backdropOpacity,
  calculateTransformValue,
}: HoldItemModalProps & { calculateTransformValue: () => number }) {
  const {
    currentId,
    itemRectY,
    itemRectX,
    itemRectWidth,
    itemRectHeight,
    itemScale,
    menuHeight,
    menuWidth,
  } = useInternal();

  const isActive = useDerivedValue(() => currentId.value === name);

  /* -------------------- STYLE ------------------------- */
  const animatedPortalStyle = useAnimatedStyle(() => {
    const animateOpacity = () =>
      withDelay(HOLD_ITEM_TRANSFORM_DURATION, withTiming(0, { duration: 0 }));

    let tY = calculateTransformValue();
    const transformAnimation = () =>
      disableMove
        ? 0
        : isActive.value
        ? withSpring(tY, SPRING_CONFIGURATION)
        : withTiming(-0.1, { duration: HOLD_ITEM_TRANSFORM_DURATION });

    return {
      zIndex: 10,
      position: 'absolute',
      top: itemRectY.value,
      left: itemRectX.value,
      width: itemRectWidth.value,
      height: itemRectHeight.value,
      opacity: isActive.value ? 1 : animateOpacity(),
      transform: [
        {
          translateY: transformAnimation(),
        },
        {
          scale: isActive.value
            ? withTiming(1, { duration: HOLD_ITEM_TRANSFORM_DURATION })
            : itemScale.value,
        },
      ],
    };
  });

  const animatedPortalProps = useAnimatedProps<ViewProps>(() => ({
    pointerEvents: isActive.value ? 'box-none' : 'none',
  }));

  const portalContainerStyle = useMemo(
    () => [styles.holdItem, animatedPortalStyle],
    [animatedPortalStyle]
  );

  const onMenuLayout = useCallback((e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;
    menuHeight.value = height;
    menuWidth.value = width;
  }, []);

  return (
    <View style={_styles.portalWrapper}>
      <Portal key={name} name={name}>
        <Animated.View
          key={name}
          style={portalContainerStyle}
          animatedProps={animatedPortalProps}
        >
          {children}
        </Animated.View>
        <Menu
          currentId={currentId}
          name={name}
          itemRectX={itemRectX}
          itemRectY={itemRectY}
          itemRectHeight={itemRectHeight}
          itemRectWidth={itemRectWidth}
          menuHeight={menuHeight}
          menuWidth={menuWidth}
          calculateTransformValue={calculateTransformValue}
          menuAnchorPosition={menuAnchorPosition || 'top-left'}
        >
          <View style={_styles.outside} pointerEvents={'box-none'}>
            <Animated.View onLayout={onMenuLayout}>{MenuElement}</Animated.View>
          </View>
        </Menu>
        <Backdrop
          backdropOpacity={backdropOpacity}
          currentId={currentId}
          name={name}
        />
      </Portal>
    </View>
  );
});

const _styles = StyleSheet.create({
  outside: {
    height: 0.001,
    width: 0.001,
    backgroundColor: 'blue',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalWrapper: {
    position: 'absolute',
  },
});
