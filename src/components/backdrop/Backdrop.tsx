import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';

// Utils
import { styles } from './styles';
import { HOLD_ITEM_TRANSFORM_DURATION, WINDOW_HEIGHT } from '../../constants';

type Context = {
  startPosition: {
    x: number;
    y: number;
  };
};

interface BackdropProps {
  currentId: SharedValue<string | undefined>;
  name: string;
  backdropOpacity?: number;
}

const BackdropComponent = ({
  currentId,
  name,
  backdropOpacity,
}: BackdropProps) => {
  const tapGestureEvent = useAnimatedGestureHandler<
    TapGestureHandlerGestureEvent,
    Context
  >({
    onStart: (event, context) => {
      context.startPosition = { x: event.x, y: event.y };
    },
    onCancel: () => {
      currentId.value = undefined;
    },
    onEnd: (event, context) => {
      const distance = Math.hypot(
        event.x - context.startPosition.x,
        event.y - context.startPosition.y
      );
      const shouldClose = distance < 10;
      const isStateActive = currentId.value === name;

      if (shouldClose && isStateActive) {
        currentId.value = undefined;
      }
    },
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    const topValueAnimation = () =>
      currentId.value === name
        ? 0
        : withDelay(
            HOLD_ITEM_TRANSFORM_DURATION,
            withTiming(WINDOW_HEIGHT, {
              duration: 0,
            })
          );

    const opacityValueAnimation = () =>
      withTiming(currentId.value === name ? 1 : 0, {
        duration: HOLD_ITEM_TRANSFORM_DURATION,
      });

    return {
      top: topValueAnimation(),
      opacity: opacityValueAnimation(),
    };
  }, []);

  const backdropStyle = useMemo(
    () => ({
      backgroundColor: 'black',
      opacity: backdropOpacity !== undefined ? backdropOpacity : 0.7,
    }),
    [backdropOpacity]
  );

  return (
    <TapGestureHandler onHandlerStateChange={tapGestureEvent}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <View style={[StyleSheet.absoluteFillObject, backdropStyle]} />
      </Animated.View>
    </TapGestureHandler>
  );
};

const Backdrop = memo(BackdropComponent);

export default Backdrop;
