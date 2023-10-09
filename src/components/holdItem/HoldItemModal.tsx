import React, { memo, useCallback, useState } from 'react';
import {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  HOLD_ITEM_SCALE_DOWN_DURATION,
  HOLD_ITEM_SCALE_DOWN_VALUE,
  HOLD_ITEM_TRANSFORM_DURATION,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from '../../constants';
import { useDeviceOrientation, useInternal } from '../../hooks';
import {
  getTransformOrigin,
  TransformOriginAnchorPosition,
} from '../../utils/calculations';
import styleGuide from '../../styleGuide';
import { HoldItemPortal } from './portal';

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

export const HoldItemModal = memo(function HoldItemModal(
  props: HoldItemModalProps
) {
  const {
    visible,
    name,
    disableMove,
    isTap,
    safeAreaInsets = { top: 0, left: 0, right: 0, bottom: 50 },
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

  useAnimatedReaction(
    () => currentId.value,
    currentId => {
      if (currentId === undefined) {
        visible.value = false;
        activeId.value = undefined;
      }
    },
    []
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
    <HoldItemPortal
      {...props}
      calculateTransformValue={calculateTransformValue}
    />
  ) : null;
});
