import React, { memo } from 'react';
import Animated, {
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { HOLD_ITEM_TRANSFORM_DURATION } from '../../constants';

import type { HoldItemProps } from './types';
import { useHoldItem } from './context';
//#endregion

const HoldItemComponent = ({ children, containerStyles }: HoldItemProps) => {
  //#endregion

  //#region variables
  const { isActive, itemScale, containerRef } = useHoldItem();

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

  //#region render
  return (
    <Animated.View ref={containerRef} style={containerStyle}>
      {children}
    </Animated.View>
  );
  //#endregion
};

export const HoldItem = memo(HoldItemComponent);
