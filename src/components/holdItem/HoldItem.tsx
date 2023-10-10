import React, { forwardRef, memo } from 'react';
import Animated, {
  measure,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { HOLD_ITEM_TRANSFORM_DURATION } from '../../constants';

import type { HoldItemProps } from './types';
import { useInternal } from '../../hooks';
import { HoldItemModal, HoldItemModalProps } from './HoldItemModal';
import { Portal } from '@gorhom/portal';
//#endregion

const HoldItemComponent = forwardRef<
  HoldItemModal,
  HoldItemProps & Partial<HoldItemModalProps>
>(({ children, name, style, ...modalProps }, ref) => {
  const { MenuElement } = modalProps;

  //#region hooks
  const {
    itemScale,
    currentId,
    activeId,
    itemRectY,
    itemRectHeight,
    itemRectX,
    itemRectWidth,
  } = useInternal();
  //#endregion

  //#region variables
  const isActive = useDerivedValue(() => currentId.value === name);
  //#endregion

  //#region refs
  const containerRef = useAnimatedRef<Animated.View>();
  //#endregion

  //#region animated styles & props
  const animatedContainerStyle = useAnimatedStyle(() => {
    const animateOpacity = () =>
      withDelay(HOLD_ITEM_TRANSFORM_DURATION, withTiming(1, { duration: 0 }));

    return {
      opacity: isActive.value ? 0 : animateOpacity(),
      transform: [
        {
          scale: isActive.value
            ? withTiming(1, { duration: HOLD_ITEM_TRANSFORM_DURATION })
            : activeId.value === name
            ? itemScale.value
            : 1,
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
    () => activeId.value,
    activeId => {
      if (activeId === name) {
        const measured = measure(containerRef);

        if (measured === null) return;

        itemRectY.value = measured.pageY;
        itemRectX.value = measured.pageX;
        itemRectHeight.value = measured.height;
        itemRectWidth.value = measured.width;
      }
    },
    [name]
  );

  //#endregion

  //#region render
  return (
    <Animated.View ref={containerRef} style={containerStyle}>
      {children}
      <Portal hostName={'hold-menu-item' + name}>{children}</Portal>
      {MenuElement ? (
        <HoldItemModal
          ref={ref}
          {...modalProps}
          name={name}
          MenuElement={MenuElement}
        >
          {children}
        </HoldItemModal>
      ) : null}
    </Animated.View>
  );
  //#endregion
});

export const HoldItem = memo(HoldItemComponent);
