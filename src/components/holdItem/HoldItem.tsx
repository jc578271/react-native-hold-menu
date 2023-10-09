import React, { memo } from 'react';
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
//#endregion

const HoldItemComponent = ({
  children,
  name,
  style,
  hasModal = true,
  ...modalProps
}: HoldItemProps & HoldItemModalProps) => {
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
    () => currentId.value,
    currentId => {
      if (currentId === undefined) {
        activeId.value = undefined;
      }
    },
    []
  );
  //#endregion
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
      {hasModal ? (
        <HoldItemModal {...modalProps} name={name}>
          {children}
        </HoldItemModal>
      ) : null}
    </Animated.View>
  );
  //#endregion
};

export const HoldItem = memo(HoldItemComponent);
