import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  runOnJS,
  runOnUI,
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
import { InteractionManager, StyleSheet, View } from 'react-native';
import { Portal } from '@gorhom/portal';

export interface HoldItemModalProps {
  name: string;
  disableMove?: boolean;
  children?: React.ReactElement | React.ReactElement[];
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
  onDismiss?: () => void;
}

export interface HoldItemModal {
  present: (isTap?: boolean) => void;
  dismiss: () => void;
}

const _HoldItemModal = memo(
  forwardRef<HoldItemModal, HoldItemModalProps>(function _HoldItemModal(
    props,
    ref
  ) {
    const {
      name,
      disableMove,
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
        (willActivateWithTap && !isAnimationStarted.value) ||
        !willActivateWithTap
      );
    }, []);
    //#endregion

    /* UI METHOD */
    const uiPresent = useCallback(
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

    const uiDismiss = useCallback(() => {
      'worklet';
      currentId.value = undefined;
    }, []);
    //#endregion
    useImperativeHandle(ref, () => ({
      present: runOnUI(uiPresent),
      dismiss: runOnUI(uiDismiss),
    }));

    return (
      <HoldItemPortal
        {...props}
        calculateTransformValue={calculateTransformValue}
      />
    );
  })
);

export const HoldItemModal = memo(
  forwardRef<HoldItemModal, HoldItemModalProps>(function HoldItemModal(
    props,
    ref
  ) {
    const { onDismiss, name } = props;
    const { activeId, currentId } = useInternal();
    const _ref = useRef<HoldItemModal>(null);

    /* ----------------------MOUNT -----------------------*/
    const [mount, setMount] = useState(false);
    const mounted = useRef(false);
    mounted.current = mount;

    const resetVariables = useCallback(function resetVariables() {
      mounted.current = false;
    }, []);

    const unmount = useCallback(
      function unmount() {
        const _mounted = mounted.current;

        // reset variables
        resetVariables();

        // unmount the node, if sheet is still mounted
        if (_mounted) {
          InteractionManager.runAfterInteractions(() =>
            setTimeout(() => {
              setMount(false);
            }, HOLD_ITEM_TRANSFORM_DURATION + 50)
          );
        }
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            onDismiss?.();
          }, HOLD_ITEM_TRANSFORM_DURATION + 50);
        });
      },
      [resetVariables, onDismiss]
    );

    /* ------- PUBLIC METHOD ----------*/
    const present = useCallback(
      (isTap?: boolean) => {
        setMount(true);
        InteractionManager.runAfterInteractions(() =>
          _ref.current?.present(isTap)
        );
      },
      [_ref.current?.present]
    );

    const dismiss = useCallback(() => {
      _ref.current?.dismiss();
      InteractionManager.runAfterInteractions(() => unmount());
    }, [unmount, _ref.current?.dismiss]);

    useImperativeHandle(ref, () => ({
      present,
      dismiss,
    }));

    /* ---------ON UNMOUNT WHEN CURRENT ID IS UNDEFINED---------------*/
    const jsUnmount = useCallback(() => {
      InteractionManager.runAfterInteractions(() => unmount());
    }, [unmount]);

    useAnimatedReaction(
      () => currentId.value,
      (currentId, prevId) => {
        if (prevId === null) return;
        if (currentId === undefined) {
          activeId.value = undefined;
          runOnJS(jsUnmount)();
        }
      },
      [unmount]
    );

    /* ------- HANDLE PORTAL ----------*/
    const handlePortalOnUnmount = useCallback(function handlePortalOnUnmount() {
      // dismiss();
      mounted.current = false;
    }, []);

    const handlePortalRender = useCallback(function handlePortalRender(
      render: () => void
    ) {
      if (mounted.current) {
        render();
      }
    },
    []);

    return mount ? (
      <View style={_styles.portalWrapper}>
        <Portal
          key={'hold-menu-modal' + name}
          name={'hold-menu-modal' + name}
          handleOnMount={handlePortalRender}
          handleOnUpdate={handlePortalRender}
          handleOnUnmount={handlePortalOnUnmount}
        >
          <_HoldItemModal ref={_ref} {...props} />
        </Portal>
      </View>
    ) : null;
  })
);

const _styles = StyleSheet.create({
  portalWrapper: {
    position: 'absolute',
  },
});
