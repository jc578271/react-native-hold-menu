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
import {
  CONTEXT_MENU_STATE,
  HOLD_ITEM_TRANSFORM_DURATION,
} from '../../constants';
import { useInternal } from '../../hooks';

import type { HoldItemProps } from './types';
import { useHoldItem } from './context';
//#endregion

const HoldItemComponent = ({
  id,
  containerStyles,
  children,
}: HoldItemProps) => {
  //#region hooks
  const { state } = useInternal();

  const {
    currentId,
    itemScale,
    animatedActiveId,
    itemRectHeight,
    itemRectY,
    itemRectX,
    itemRectWidth,
  } = useHoldItem();
  //#endregion

  //#region variables
  const isActive = useDerivedValue(() => currentId.value === id, [id]);
  //#endregion

  //#region refs
  const containerRef = useAnimatedRef<Animated.View>();
  //#endregion

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
            : itemScale.value,
        },
      ],
    };
  });
  const containerStyle = React.useMemo(
    () => [containerStyles, animatedContainerStyle],
    [containerStyles, animatedContainerStyle]
  );
  //#endregion

  //#region animated effects
  useAnimatedReaction(
    () => state.value,
    _state => {
      if (_state === CONTEXT_MENU_STATE.END) {
        currentId.value = undefined;
        animatedActiveId.value = undefined;
      }
    }
  );
  //#endregion

  /* set layout when active Id changes */
  useAnimatedReaction(
    () => animatedActiveId.value,
    activeId => {
      if (activeId && activeId === id) {
        const measured = measure(containerRef);

        if (measured === null) return;

        itemRectY.value = measured.pageY;
        itemRectX.value = measured.pageX;
        itemRectHeight.value = measured.height;
        itemRectWidth.value = measured.width;
      }
    },
    [id]
  );

  //#endregion

  //#region render
  return (
    <Animated.View ref={containerRef} style={containerStyle}>
      {children}
    </Animated.View>
  );
  //#endregion
};

export const HoldItem = memo(HoldItemComponent);
