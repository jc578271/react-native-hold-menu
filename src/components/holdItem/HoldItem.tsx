import React, { memo, useCallback, useMemo } from 'react';
import Animated, {
  measure,
  runOnJS,
  SharedValue,
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

import { HoldItemContext } from './context';
import { useDeviceOrientation, useInternal } from '../../hooks';
import { getTransformOrigin } from '../../utils/calculations';
import { HoldItemModal } from './HoldItemModal';
import { useInitValue } from '../../hooks/useInitValue';
import { ViewStyle } from 'react-native';
import { HoldItemPortalProps } from './HoldItemPortal';
//#endregion

export interface HoldItemProps extends HoldItemPortalProps {
  visible?: SharedValue<boolean>;
  children: React.ReactElement | React.ReactElement[];
  style?: ViewStyle | ViewStyle[];
  bottom?: boolean;
  CustomModalElement?: JSX.Element | null;
  isTap?: boolean;
}

const HoldItemComponent = ({
  visible,
  children,
  style,
  bottom,
  CustomModalElement,
  isTap,
  ...modalProps
}: HoldItemProps) => {
  const { menuAnchorPosition, id } = modalProps;

  const { setRenderChildren, currentId, ...internalValue } = useInternal();

  const onRenderChildren = useCallback(() => {
    setRenderChildren(children as any);
  }, [children]);

  const onRenderNull = useCallback(() => {
    setRenderChildren(null);
  }, []);

  const {
    itemRectY,
    itemRectX,
    itemRectWidth,
    itemRectHeight,
    itemScale,
    transformOrigin,
    menuHeight,
    menuWidth,
    state,
  } = visible ? useInitValue({ menuAnchorPosition }) : internalValue;

  //#region variables
  const isActive = useDerivedValue(
    () => {
      if (visible) return state.value === CONTEXT_MENU_STATE.ACTIVE;
      return currentId.value === id
    }
  );

  const deviceOrientation = useDeviceOrientation();
  const isAnimationStarted = useSharedValue(false);
  //#endregion

  //#region refs
  const containerRef = useAnimatedRef<Animated.View>();
  //#endregion

  /* -----------------CALLBACK ---------------------------*/
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
      if (!visible) runOnJS(onRenderChildren)();
      if (canCallActivateFunctions(isTap)) {
        activateAnimation();
        if (!isActive.value) {
          if (!isTap) {
            scaleHold();
          } else {
            scaleTap();
          }
        }
      }
    },
    [onCompletion, activateAnimation, children, visible]
  );

  const dismiss = useCallback(() => {
    'worklet';
    if (!visible) runOnJS(onRenderNull)();
    state.value = CONTEXT_MENU_STATE.END;
  }, [visible]);
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
        if (visible) visible.value = false;
      }
    },
    []
  );
  //#endregion
  /* trigger when visible changes */
  if (visible)
    useAnimatedReaction(
      () => visible.value,
      _visible => {
        if (_visible) {
          present(isTap);
        } else {
          dismiss();
        }
      },
      [present, isTap, dismiss]
    );

  /* trigger when currentId changes */
  if (!visible)
    useAnimatedReaction(
      () => currentId.value,
      currentId => {
        if (currentId === id) {
          present(isTap);
        } else {
          dismiss();
        }
      },
      [id, present, isTap, dismiss]
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
      transformOrigin,
      menuHeight,
      menuWidth,
      state,
    }),
    []
  );

  //#region render
  return (
    <HoldItemContext.Provider value={returnValue}>
      <Animated.View
        ref={containerRef}
        // @ts-ignore
        style={containerStyle}
      >
        {children}
        {visible ? (
          <HoldItemModal visible={visible} {...modalProps}>
            {CustomModalElement !== undefined ? CustomModalElement : children}
          </HoldItemModal>
        ) : null}
      </Animated.View>
    </HoldItemContext.Provider>
  );
  //#endregion
};

export const HoldItem = memo(HoldItemComponent);
