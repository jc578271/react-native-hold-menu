import React, { memo, useCallback, useMemo } from 'react';
import { HoldItemContext } from './context';
import Animated, {
  measure, useAnimatedReaction,
  useAnimatedRef,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { TransformOriginAnchorPosition } from '../../utils/calculations';
import { HoldItemProviderProps } from './types';
import { getTransformOrigin } from '../../utils/calculations';
import {
  CONTEXT_MENU_STATE,
  HOLD_ITEM_SCALE_DOWN_DURATION,
  HOLD_ITEM_SCALE_DOWN_VALUE,
  HOLD_ITEM_TRANSFORM_DURATION,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../../constants';
import {
  useDeviceOrientation,
  useInternal,
} from '../../hooks';
import styleGuide from '../../styleGuide';

export const HoldItemProvider = memo(function HoldItemProvider({
  children,
  ...rest
}: HoldItemProviderProps) {
  const {
    menuAnchorPosition,
    disableMove,
    bottom,
    items,
    actionParams,
    hapticFeedback,
  } = rest;

  const { state, safeAreaInsets, menuProps } = useInternal();

  const isActive = useSharedValue(false);
  const isAnimationStarted = useSharedValue(false);

  const itemRectY = useSharedValue<number>(0);
  const itemRectX = useSharedValue<number>(0);
  const itemRectWidth = useSharedValue<number>(0);
  const itemRectHeight = useSharedValue<number>(0);
  const itemScale = useSharedValue<number>(1);
  const transformValue = useSharedValue<number>(0);
  const menuHeight = useSharedValue<number>(0);

  const containerRef = useAnimatedRef<Animated.View>();

  const deviceOrientation = useDeviceOrientation();

  const transformOrigin = useSharedValue<TransformOriginAnchorPosition>(
    menuAnchorPosition || 'top-right'
  );

  const canCallActivateFunctions = useCallback((isTap?: boolean) => {
    'worklet';
    const willActivateWithTap = isTap;

    return (
      (willActivateWithTap && !isAnimationStarted.value) || !willActivateWithTap
    );
  }, []);

  const activateAnimation = useCallback(() => {
    'worklet';
    const measured = measure(containerRef);

    if (measured === null) return;

    itemRectY.value = measured.pageY;
    itemRectX.value = measured.pageX;
    itemRectHeight.value = measured.height;
    itemRectWidth.value = measured.width;

    if (!menuAnchorPosition) {
      const position = getTransformOrigin(
        measured.pageX,
        itemRectWidth.value,
        deviceOrientation === 'portrait' ? WINDOW_WIDTH : WINDOW_HEIGHT,
        bottom
      );
      transformOrigin.value = position;
    }
  }, [bottom, deviceOrientation, menuAnchorPosition]);

  const calculateTransformValue = useCallback(() => {
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
  }, [deviceOrientation, disableMove, safeAreaInsets]);

  const setMenuProps = useCallback(() => {
    'worklet';

    menuProps.value = {
      itemHeight: itemRectHeight.value,
      itemWidth: itemRectWidth.value,
      itemY: itemRectY.value,
      itemX: itemRectX.value,
      anchorPosition: transformOrigin.value,
      menuHeight: menuHeight.value,
      items,
      transformValue: transformValue.value,
      actionParams: actionParams || {},
    };
  }, [items, actionParams]);

  const scaleBack = useCallback(() => {
    'worklet';
    itemScale.value = withTiming(1, {
      duration: HOLD_ITEM_TRANSFORM_DURATION / 2,
    });
  }, []);

  const onCompletion = useCallback(
    (isFinised?: boolean) => {
      'worklet';
      const isListValid = items && items.length > 0;
      if (isFinised && isListValid) {
        state.value = CONTEXT_MENU_STATE.ACTIVE;
        isActive.value = true;
        scaleBack();
        if (hapticFeedback !== 'None') {
          // runOnJS(hapticResponse)();
        }
      }

      isAnimationStarted.value = false;

      // TODO: Warn user if item list is empty or not given
    },
    [items, hapticFeedback, scaleBack]
  );

  const scaleHold = useCallback(() => {
    'worklet';
    itemScale.value = withTiming(
      HOLD_ITEM_SCALE_DOWN_VALUE,
      { duration: HOLD_ITEM_SCALE_DOWN_DURATION },
      onCompletion
    );
  }, [onCompletion]);

  const scaleTap = useCallback(() => {
    'worklet';
    isAnimationStarted.value = true;

    itemScale.value = withSequence(
      withTiming(HOLD_ITEM_SCALE_DOWN_VALUE, {
        duration: HOLD_ITEM_SCALE_DOWN_DURATION,
      }),
      withTiming(
        1,
        {
          duration: HOLD_ITEM_TRANSFORM_DURATION / 2,
        },
        onCompletion
      )
    );
  }, [onCompletion]);

  //#region gesture events
  const present = useCallback(
    (isTap?: boolean) => {
      'worklet';
      if (canCallActivateFunctions(isTap)) {
        activateAnimation();
        transformValue.value = calculateTransformValue();
        setMenuProps();

        if (!isActive.value) {
          if (!isTap) {
            scaleHold();
          } else {
            scaleTap();
          }
        }
      }
    },
    [
      activateAnimation,
      calculateTransformValue,
      setMenuProps,
      scaleHold,
      scaleTap,
    ]
  );

  //#region animated effects
  useAnimatedReaction(
    () => state.value,
    _state => {
      if (_state === CONTEXT_MENU_STATE.END) {
        isActive.value = false;
      }
    }
  );

  const returnValue = useMemo(
    () => ({
      ...rest,
      isActive,
      isAnimationStarted,
      itemRectY,
      itemRectX,
      itemRectWidth,
      itemRectHeight,
      itemScale,
      transformValue,
      transformOrigin,
      menuHeight,
      present,
      containerRef,
    }),
    [present, rest]
  );

  return (
    <HoldItemContext.Provider value={returnValue}>
      {children}
    </HoldItemContext.Provider>
  );
});
