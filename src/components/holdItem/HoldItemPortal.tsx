import { TransformOriginAnchorPosition } from '../../utils/calculations';
import React, { memo, useCallback, useMemo } from 'react';
import { useHoldItem } from './context';
import { nanoid } from 'nanoid/non-secure';
import Animated, {
  SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  CONTEXT_MENU_STATE,
  HOLD_ITEM_TRANSFORM_DURATION,
  SPRING_CONFIGURATION,
} from '../../constants';
import { useDeviceOrientation, useInternal } from '../../hooks';
import { calculateTransformValue } from '../../utils/calculateTransformValue';
import { LayoutChangeEvent, StyleSheet, View, ViewProps } from 'react-native';
import styles from './styles';
import { Portal } from '@gorhom/portal';
import Menu from '../menu';
import { Backdrop } from '../backdrop';

export interface HoldItemPortalProps {
  id?: string;
  children: any;
  disableMove?: boolean;
  menuAnchorPosition?: TransformOriginAnchorPosition;
  MenuElement: JSX.Element;
  backdropOpacity?: number;
  safeAreaInsets?: { top: number; right: number; bottom: number; left: number };
}

export const HoldItemPortal = memo(function HoldItemPortal({
  children,
  id,
  visible,
  ...props
}: HoldItemPortalProps & { visible?: SharedValue<boolean> }) {
  const { renderChildren, currentId } = useInternal();

  const { disableMove, MenuElement, backdropOpacity, safeAreaInsets } = props;

  const holdItemValue = useHoldItem();

  const {
    state,
    itemRectY,
    itemRectX,
    itemRectWidth,
    itemRectHeight,
    itemScale,
    menuHeight,
    menuWidth,
    transformOrigin,
  } = holdItemValue;

  const key = useMemo(() => `hold-item-${nanoid()}`, []);

  const isActive = useDerivedValue(() => {
    if (!visible) return state.value === CONTEXT_MENU_STATE.ACTIVE;
    return currentId.value === id;
  });

  /* change currentId when visible is triggered */
  if (visible)
    useAnimatedReaction(
      () => visible.value,
      visible => {
        if (visible) {
          currentId.value = id;
        } else {
          currentId.value = undefined;
        }
      },
      [id]
    );

  const deviceOrientation = useDeviceOrientation();

  /* -------------------- STYLE ------------------------- */
  const animatedPortalStyle = useAnimatedStyle(() => {
    const animateOpacity = () =>
      withDelay(HOLD_ITEM_TRANSFORM_DURATION, withTiming(0, { duration: 0 }));

    let tY = calculateTransformValue({
      deviceOrientation,
      transformOrigin: transformOrigin.value,
      disableMove,
      itemRectY: itemRectY.value,
      itemRectHeight: itemRectHeight.value,
      menuHeight: menuHeight.value,
      safeAreaInsets: safeAreaInsets,
    });
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
      <Portal key={key} name={key}>
        <Animated.View
          key={key}
          // @ts-ignore
          style={portalContainerStyle}
          animatedProps={animatedPortalProps}
        >
          {renderChildren || children}
        </Animated.View>
        <Menu {...props} {...holdItemValue}>
          <View style={_styles.outside} pointerEvents={'box-none'}>
            <Animated.View onLayout={onMenuLayout}>{MenuElement}</Animated.View>
          </View>
        </Menu>
        <Backdrop backdropOpacity={backdropOpacity} state={state} />
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
