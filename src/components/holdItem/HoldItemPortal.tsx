import React, { memo, useMemo } from 'react';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Portal } from '@gorhom/portal';
import { nanoid } from 'nanoid/non-secure';
import { HoldItemPortalProps } from './types';
import styles from './styles';
import { ViewProps } from 'react-native';
import {
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { CONTEXT_MENU_STATE } from '../../constants';
import { useDeviceOrientation, useInternal } from '../../hooks';
import {
  HOLD_ITEM_TRANSFORM_DURATION,
  SPRING_CONFIGURATION,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../../constants';
import styleGuide from '../../styleGuide';
import { useHoldItem } from './context';

export const HoldItemPortal = memo(function HoldItemPortal({
  children,
}: HoldItemPortalProps) {
  const { state, safeAreaInsets } = useInternal();
  const {
    transformOrigin,
    itemRectY,
    itemRectX,
    itemRectHeight,
    itemRectWidth,
    isActive,
    itemScale,
    menuHeight,
    disableMove,
    closeOnTap,
  } = useHoldItem();
  const key = useMemo(() => `hold-item-${nanoid()}`, []);
  const deviceOrientation = useDeviceOrientation();

  const animatedPortalStyle = useAnimatedStyle(() => {
    const animateOpacity = () =>
      withDelay(HOLD_ITEM_TRANSFORM_DURATION, withTiming(0, { duration: 0 }));

    const calculateTransformValue = () => {
      'worklet';

      const height =
        deviceOrientation === 'portrait' ? WINDOW_HEIGHT : WINDOW_WIDTH;

      const isAnchorPointTop = transformOrigin.value.includes('top');

      let tY = 0;
      if (!disableMove) {
        if (isAnchorPointTop) {
          const topTransform =
            itemRectY.value +
            itemRectHeight.value +
            menuHeight.value +
            styleGuide.spacing +
            (safeAreaInsets?.bottom || 0);

          tY = topTransform > height ? height - topTransform : 0;
        } else {
          const bottomTransform =
            itemRectY.value - menuHeight.value - (safeAreaInsets?.top || 0);
          tY =
            bottomTransform < 0 ? -bottomTransform + styleGuide.spacing * 2 : 0;
        }
      }
      return tY;
    };

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

  const portalContainerStyle = useMemo(
    () => [styles.holdItem, animatedPortalStyle],
    [animatedPortalStyle]
  );

  const animatedPortalProps = useAnimatedProps<ViewProps>(() => ({
    pointerEvents: isActive.value ? 'auto' : 'none',
  }));

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
    <Portal key={key} name={key}>
      <Animated.View
        key={key}
        style={portalContainerStyle}
        animatedProps={animatedPortalProps}
      >
        <PortalOverlay />
        {children}
      </Animated.View>
    </Portal>
  );
});
