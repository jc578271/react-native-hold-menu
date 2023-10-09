import React, { memo, useCallback, useMemo, useState } from 'react';
import { Portal } from '@gorhom/portal';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { nanoid } from 'nanoid/non-secure';
import styles from './styles';
import {
  HOLD_ITEM_SCALE_DOWN_DURATION,
  HOLD_ITEM_SCALE_DOWN_VALUE,
  HOLD_ITEM_TRANSFORM_DURATION,
  SPRING_CONFIGURATION,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../../constants';
import { LayoutChangeEvent, StyleSheet, View, ViewProps } from 'react-native';
import Menu from '../menu';
import { Backdrop } from '../backdrop';
import { useDeviceOrientation, useInternal } from '../../hooks';
import {
  getTransformOrigin,
  TransformOriginAnchorPosition,
} from '../../utils/calculations';
import styleGuide from '../../styleGuide';

export interface HoldItemModalProps {
  visible: SharedValue<boolean>;
  name: string;
  disableMove?: boolean;
  children: React.ReactElement | React.ReactElement[];
  menuAnchorPosition?: TransformOriginAnchorPosition;
  MenuElement: JSX.Element;
  backdropOpacity?: number;
  isTap?: boolean;
  CustomModalElement?: JSX.Element | null;
  bottom?: boolean;
  safeAreaInsets?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

const _HoldItemModal = memo(function _HoldItemPortal({
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

  const key = useMemo(() => `hold-item-${nanoid()}`, []);

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
      <Portal key={key} name={key}>
        <Animated.View
          key={key}
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

export const HoldItemModal = memo(function HoldItemModal(
  props: HoldItemModalProps
) {
  const {
    visible,
    name,
    disableMove,
    isTap,
    safeAreaInsets,
    menuAnchorPosition,
    bottom,
  } = props;
  const {
    currentId,
    activeId,
    itemRectY,
    itemRectX,
    itemRectWidth,
    itemRectHeight,
    itemScale,
    menuHeight,
    transformOrigin,
  } = useInternal();

  const isActive = useDerivedValue(() => currentId.value === name);

  const isAnimationStarted = useSharedValue(false);
  const deviceOrientation = useDeviceOrientation();

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
  }, [deviceOrientation, safeAreaInsets, disableMove]);

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

  const onCompletion = useCallback(
    (isFinised?: boolean) => {
      'worklet';
      if (isFinised) {
        currentId.value = name;
        scaleBack();
      }

      isAnimationStarted.value = false;
    },
    [name]
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
      (willActivateWithTap && !isAnimationStarted.value) || !willActivateWithTap
    );
  }, []);
  //#endregion

  /* PUBLIC METHOD */
  const present = useCallback(
    (isTap?: boolean) => {
      'worklet';
      activeId.value = name;
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
    [onCompletion, activateAnimation, name]
  );

  const dismiss = useCallback(() => {
    'worklet';
    currentId.value = undefined;
  }, []);
  //#endregion
  /* ----------------------TRIGGER -----------------------*/
  useAnimatedReaction(
    () => visible.value,
    visible => {
      if (visible) {
        present(isTap);
      } else {
        dismiss();
      }
    },
    [isTap, present]
  );

  /* ----------------------MOUNT---------------------------*/
  const [mounted, setMount] = useState(false);
  const unMount = useCallback(() => {
    setTimeout(() => {
      setMount(false);
    }, HOLD_ITEM_TRANSFORM_DURATION + 50);
  }, []);

  useAnimatedReaction(
    () => ({
      currentId: currentId.value,
      activeId: activeId.value,
    }),
    (value, prev) => {
      if (value.activeId === name && prev?.activeId !== value.activeId) {
        runOnJS(setMount)(true);
      }
      if (
        value.currentId === undefined &&
        prev?.currentId !== value.currentId
      ) {
        runOnJS(unMount)();
      }
    },
    [name]
  );

  return mounted ? (
    <_HoldItemModal
      {...props}
      calculateTransformValue={calculateTransformValue}
    />
  ) : null;
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
