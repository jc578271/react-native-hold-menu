import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
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
  currentId: SharedValue<string>;
  id?: string;
  backdropOpacity?: number;
}

const BackdropComponent = ({
  state,
  backdropOpacity,
  currentId,
  id,
}: BackdropProps) => {
  const isActive = useDerivedValue(() =>
    id === undefined
      ? state.value === CONTEXT_MENU_STATE.ACTIVE
      : currentId.value === id
  );

  const onEnd = useCallback(() => {
    'worklet';
    if (id === undefined) {
      state.value = CONTEXT_MENU_STATE.END;
    } else {
      currentId.value = '';
    }
  }, [id]);

  const tapGestureEvent = useAnimatedGestureHandler<
    TapGestureHandlerGestureEvent,
    Context
  >({
    onStart: (event, context) => {
      context.startPosition = { x: event.x, y: event.y };
    },
    onCancel: () => {
      onEnd();
    },
    onEnd: (event, context) => {
      const distance = Math.hypot(
        event.x - context.startPosition.x,
        event.y - context.startPosition.y
      );
      const shouldClose = distance < 10;
      const isStateActive = isActive.value;

      if (shouldClose && isStateActive) {
        onEnd();
      }
    },
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    const topValueAnimation = () =>
      isActive.value
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
      opacity: backdropOpacity || 0.7,
    }),
    [backdropOpacity]
  );

  return (
    <TapGestureHandler onHandlerStateChange={tapGestureEvent}>
      <Animated.View
        //@ts-ignore
        style={[styles.container, animatedContainerStyle]}
      >
        <View style={[StyleSheet.absoluteFillObject, backdropStyle]} />
      </Animated.View>
    </TapGestureHandler>
  );
};

const Backdrop = memo(BackdropComponent);

export default Backdrop;
