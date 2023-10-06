import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
} from 'react';
import { Portal } from '@gorhom/portal';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { nanoid } from 'nanoid/non-secure';
import { HoldItemPortalProps } from './types';
import {
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import styles from './styles';
import {
  CONTEXT_MENU_STATE,
  HOLD_ITEM_SCALE_DOWN_DURATION,
  HOLD_ITEM_SCALE_DOWN_VALUE,
  HOLD_ITEM_TRANSFORM_DURATION,
  SPRING_CONFIGURATION,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../../constants';
import { ViewProps } from 'react-native';
import { useInternal } from '../../hooks';
import { useHoldItem } from './context';
import { getTransformOrigin } from '../../utils/calculations';
import { useDeviceOrientation } from '../../hooks';
import styleGuide from '../../styleGuide';

export interface HoldItemModal {
  present: (isTap?: boolean) => void;
  dismiss: () => void;
}

const _HoldItemModal = forwardRef<HoldItemModal, HoldItemPortalProps>(
  function HoldItemPortal(
    { children, disableMove, closeOnTap, menuAnchorPosition, id, bottom },
    ref
  ) {
    const { menuProps, state, safeAreaInsets } = useInternal();

    const {
      currentId,
      itemRectY,
      itemRectX,
      itemRectWidth,
      itemRectHeight,
      itemScale,
      menuHeight,
      transformValue,
      transformOrigin,
      animatedActiveId,
    } = useHoldItem();

    const deviceOrientation = useDeviceOrientation();
    const isAnimationStarted = useSharedValue(false);
    const key = useMemo(() => `hold-item-${nanoid()}`, []);

    const isActive = useDerivedValue(() => currentId.value === id, [id]);

    /* -----------------CALLBACK ---------------------------*/
    //#region worklet functions
    const activateAnimation = useCallback(() => {
      'worklet';
      if (!menuAnchorPosition) {
        const position = getTransformOrigin(
          itemRectX.value,
          itemRectWidth.value,
          deviceOrientation === 'portrait' ? WINDOW_WIDTH : WINDOW_HEIGHT,
          bottom
        );
        transformOrigin.value = position;
      }
    }, [menuAnchorPosition, bottom, deviceOrientation]);

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

    const setMenuProps = useCallback(() => {
      'worklet';

      menuProps.value = {
        itemHeight: itemRectHeight.value,
        itemWidth: itemRectWidth.value,
        itemY: itemRectY.value,
        itemX: itemRectX.value,
        anchorPosition: transformOrigin.value,
        menuHeight: menuHeight.value,
        transformValue: transformValue.value,
      };
    }, []);

    const scaleBack = useCallback(() => {
      'worklet';
      itemScale.value = withTiming(1, {
        duration: HOLD_ITEM_TRANSFORM_DURATION / 2,
      });
    }, []);

    const onCompletion = useCallback(
      (isFinised?: boolean) => {
        'worklet';
        if (isFinised) {
          state.value = CONTEXT_MENU_STATE.ACTIVE;
          // isActive.value = true;
          currentId.value = id;
          scaleBack();
        }

        isAnimationStarted.value = false;
      },
      [id]
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

    /**
     * When use tap activation ("tap") and trying to tap multiple times,
     * scale animation is called again despite it is started. This causes a bug.
     * To prevent this, it is better to check is animation already started.
     */
    const canCallActivateFunctions = useCallback((isTap?: boolean) => {
      'worklet';
      const willActivateWithTap = isTap;

      return (
        (willActivateWithTap && !isAnimationStarted.value) ||
        !willActivateWithTap
      );
    }, []);
    //#endregion

    /* PUBLIC METHOD */
    const present = useCallback(
      (isTap?: boolean) => {
        'worklet';
        animatedActiveId.value = id;
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
      [activateAnimation, calculateTransformValue, onCompletion]
    );

    const dismiss = useCallback(() => {
      'worklet';
      state.value = CONTEXT_MENU_STATE.END;
    }, []);

    /*---------------------- REF ----------------------------*/
    useImperativeHandle(ref, () => ({ present, dismiss }));

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
      pointerEvents: isActive.value ? 'auto' : 'none',
    }));

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
  }
);

export const HoldItemModal = memo(_HoldItemModal);
