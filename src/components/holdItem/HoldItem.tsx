import React, { memo, useCallback, useMemo } from 'react';
import Animated, {
  measure,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  CONTEXT_MENU_STATE,
  HOLD_ITEM_SCALE_DOWN_DURATION,
  HOLD_ITEM_SCALE_DOWN_VALUE,
  HOLD_ITEM_TRANSFORM_DURATION,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../../constants';

import type { HoldItemProps } from './types';
import { HoldItemContext } from './context';
import { useDeviceOrientation } from '../../hooks';
import {
  getTransformOrigin,
  TransformOriginAnchorPosition,
} from '../../utils/calculations';
import styleGuide from '../../styleGuide';
import { HoldItemModal } from './HoldItemModal';
//#endregion

const HoldItemComponent = ({ children, ...props }: HoldItemProps) => {
  const {
    visible,
    style,
    menuAnchorPosition,
    bottom,
    disableMove,
    safeAreaInsets = { top: 10, left: 0, right: 0, bottom: 50 },
    isTap,
    CustomModalElement,
  } = props;

  //#region hooks
  const state = useSharedValue<CONTEXT_MENU_STATE>(
    CONTEXT_MENU_STATE.UNDETERMINED
  );

  const itemRectY = useSharedValue<number>(0);
  const itemRectX = useSharedValue<number>(0);
  const itemRectWidth = useSharedValue<number>(0);
  const itemRectHeight = useSharedValue<number>(0);
  const itemScale = useSharedValue<number>(1);
  const transformValue = useSharedValue<number>(0);

  const transformOrigin = useSharedValue<TransformOriginAnchorPosition>(
    menuAnchorPosition || 'top-left'
  );

  const menuHeight = useSharedValue<number>(0);
  const menuWidth = useSharedValue<number>(0);
  //#endregion

  //#region variables
  const isActive = useDerivedValue(
    () => state.value === CONTEXT_MENU_STATE.ACTIVE
  );

  const deviceOrientation = useDeviceOrientation();
  const isAnimationStarted = useSharedValue(false);
  //#endregion

  //#region refs
  const containerRef = useAnimatedRef<Animated.View>();
  //#endregion

  /* -----------------CALLBACK ---------------------------*/
  //#region worklet functions
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
  }, [safeAreaInsets, deviceOrientation, disableMove]);

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
        itemRectX.value,
        itemRectWidth.value,
        deviceOrientation === 'portrait' ? WINDOW_WIDTH : WINDOW_HEIGHT,
        bottom
      );
      transformOrigin.value = position;
    } else {
      transformOrigin.value = menuAnchorPosition || 'top-left';
    }
  }, [menuAnchorPosition, bottom, deviceOrientation]);

  const scaleBack = useCallback(() => {
    'worklet';
    itemScale.value = withTiming(1, {
      duration: HOLD_ITEM_TRANSFORM_DURATION / 2,
    });
  }, []);

  const onCompletion = useCallback((isFinised?: boolean) => {
    'worklet';
    if (isFinised) {
      state.value = CONTEXT_MENU_STATE.ACTIVE;
      scaleBack();
    }

    isAnimationStarted.value = false;
  }, []);

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

  /**
   * When use tap activation ("tap") and trying to tap multiple times,
   * scale animation is called again despite it is started. This causes a bug.
   * To prevent this, it is better to check is animation already started.
   */
  const canCallActivateFunctions = useCallback((isTap?: boolean) => {
    'worklet';
    const willActivateWithTap = isTap;

    return (
      (willActivateWithTap && !isAnimationStarted.value) || !willActivateWithTap
    );
  }, []);
  //#endregion

  /* PUBLIC METHOD */
  const present = useCallback(
    (isTap?: boolean) => {
      'worklet';
      if (canCallActivateFunctions(isTap)) {
        activateAnimation();
        transformValue.value = calculateTransformValue();
        if (!isActive.value) {
          if (!isTap) {
            scaleHold();
          } else {
            scaleTap();
          }
        }
      }
    },
    [onCompletion, activateAnimation, calculateTransformValue]
  );

  const dismiss = useCallback(() => {
    'worklet';
    state.value = CONTEXT_MENU_STATE.END;
  }, []);
  //#endregion

  //#region animated styles & props
  const animatedContainerStyle = useAnimatedStyle(() => {
    const animateOpacity = () =>
      withDelay(
        HOLD_ITEM_TRANSFORM_DURATION - 50,
        withTiming(1, { duration: 0 })
      );

    return {
      opacity: isActive.value ? 0 : animateOpacity(),
      transform: [
        {
          scale: isActive.value
            ? withTiming(1, { duration: HOLD_ITEM_TRANSFORM_DURATION })
            : itemScale.value,
        },
      ],
    };
  });

  const containerStyle = React.useMemo(() => [style, animatedContainerStyle], [
    style,
    animatedContainerStyle,
  ]);
  //#endregion

  //#region animated effects
  useAnimatedReaction(
    () => state.value,
    _state => {
      if (_state === CONTEXT_MENU_STATE.END) {
        visible.value = false;
      }
    },
    []
  );
  //#endregion
  useAnimatedReaction(
    () => visible.value,
    _visible => {
      if (_visible) {
        present(isTap);
      } else {
        dismiss();
      }
    },
    [present, isTap]
  );

  //#endregion
  /* ----------------------PROVIDER --------------------------*/

  const returnValue = useMemo(
    () => ({
      itemRectY,
      itemRectX,
      itemRectWidth,
      itemRectHeight,
      itemScale,
      transformValue,
      transformOrigin,
      menuHeight,
      menuWidth,
      state,
      calculateTransformValue,
      ...props,
    }),
    [props]
  );

  //#region render
  return (
    <HoldItemContext.Provider value={returnValue}>
      <Animated.View ref={containerRef} style={containerStyle}>
        {children}
        <HoldItemModal>
          {CustomModalElement !== undefined ? CustomModalElement : children}
        </HoldItemModal>
      </Animated.View>
    </HoldItemContext.Provider>
  );
  //#endregion
};

export const HoldItem = memo(HoldItemComponent);
