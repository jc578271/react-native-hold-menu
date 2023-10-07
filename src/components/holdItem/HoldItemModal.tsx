import React, { memo, PropsWithChildren, useMemo } from 'react';
import { Portal } from '@gorhom/portal';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { nanoid } from 'nanoid/non-secure';
import {
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import styles from './styles';
import {
  CONTEXT_MENU_STATE,
  HOLD_ITEM_TRANSFORM_DURATION,
  SPRING_CONFIGURATION,
} from '../../constants';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useHoldItem } from './context';
import Menu from '../menu';
import { Backdrop } from '../backdrop';

export const HoldItemModal = memo(function HoldItemPortal({
  children,
}: PropsWithChildren<{}>) {
  const {
    state,
    itemRectY,
    itemRectX,
    itemRectWidth,
    itemRectHeight,
    itemScale,
    transformValue,
    menuHeight,
    menuWidth,
    calculateTransformValue,
    disableMove,
    closeOnTap,
    menuAnchorPosition,
    MenuElement,
    backDropOpacity,
  } = useHoldItem();

  const key = useMemo(() => `hold-item-${nanoid()}`, []);

  const isActive = useDerivedValue(
    () => state.value === CONTEXT_MENU_STATE.ACTIVE,
    []
  );

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
  }, [calculateTransformValue, disableMove]);

  const animatedPortalProps = useAnimatedProps<ViewProps>(() => ({
    pointerEvents: isActive.value ? 'auto' : 'none',
  }), []);

  const portalContainerStyle = useMemo(
    () => [styles.holdItem, animatedPortalStyle],
    [animatedPortalStyle]
  );

  const overlayGestureEvent = useAnimatedGestureHandler<
    TapGestureHandlerGestureEvent,
    any
  >({
    onActive: _ => {
      if (closeOnTap) state.value = CONTEXT_MENU_STATE.END;
    },
  });

  const PortalOverlay = useMemo(() => {
    return () => (
      <TapGestureHandler
        numberOfTaps={1}
        onHandlerStateChange={overlayGestureEvent}
      >
        <Animated.View style={styles.portalOverlay} />
      </TapGestureHandler>
    );
  }, [overlayGestureEvent]);

  return (
    <View style={_styles.portalWrapper}>
      <Portal key={key} name={key}>
        <Animated.View
          key={key}
          style={portalContainerStyle}
          animatedProps={animatedPortalProps}
        >
          <PortalOverlay />
          {children}
        </Animated.View>
        <Menu
          state={state}
          itemRectX={itemRectX}
          itemRectY={itemRectY}
          itemRectHeight={itemRectHeight}
          itemRectWidth={itemRectWidth}
          transformValue={transformValue}
          menuHeight={menuHeight}
          menuWidth={menuWidth}
          menuAnchorPosition={menuAnchorPosition || 'top-left'}
        >
          <View style={_styles.outside} pointerEvents={'box-none'}>
            <Animated.View
              onLayout={e => {
                menuHeight.value = e.nativeEvent.layout.height;
                menuWidth.value = e.nativeEvent.layout.width;
              }}
            >
              {MenuElement}
            </Animated.View>
          </View>
        </Menu>
        <Backdrop backDropOpacity={backDropOpacity} state={state} />
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
