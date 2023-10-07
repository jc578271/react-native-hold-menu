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
import {
  CONTEXT_MENU_STATE,
  HOLD_ITEM_TRANSFORM_DURATION,
  WINDOW_HEIGHT,
} from '../../constants';

type Context = {
  startPosition: {
    x: number;
    y: number;
  };
};

interface BackdropProps {
  state: SharedValue<CONTEXT_MENU_STATE>;
  backDropOpacity?: number;
}

const BackdropComponent = ({ state, backDropOpacity }: BackdropProps) => {
  const tapGestureEvent = useAnimatedGestureHandler<
    TapGestureHandlerGestureEvent,
    Context
  >(
    {
      onStart: (event, context) => {
        context.startPosition = { x: event.x, y: event.y };
      },
      onCancel: () => {
        state.value = CONTEXT_MENU_STATE.END;
      },
      onEnd: (event, context) => {
        const distance = Math.hypot(
          event.x - context.startPosition.x,
          event.y - context.startPosition.y
        );
        const shouldClose = distance < 10;
        const isStateActive = state.value === CONTEXT_MENU_STATE.ACTIVE;

        if (shouldClose && isStateActive) {
          state.value = CONTEXT_MENU_STATE.END;
        }
      },
    },
    [state]
  );

  const animatedContainerStyle = useAnimatedStyle(() => {
    const topValueAnimation = () =>
      state.value === CONTEXT_MENU_STATE.ACTIVE
        ? 0
        : withDelay(
            HOLD_ITEM_TRANSFORM_DURATION,
            withTiming(WINDOW_HEIGHT, {
              duration: 0,
            })
          );

    const opacityValueAnimation = () =>
      withTiming(state.value === CONTEXT_MENU_STATE.ACTIVE ? 1 : 0, {
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
      opacity: backDropOpacity,
    }),
    [backDropOpacity]
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
