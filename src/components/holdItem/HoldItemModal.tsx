import React, { memo, useCallback, useState } from 'react';
import {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
} from 'react-native-reanimated';
import {
  CONTEXT_MENU_STATE,
  HOLD_ITEM_TRANSFORM_DURATION,
} from '../../constants';
import { useHoldItem } from './context';
import { HoldItemPortal, HoldItemPortalProps } from './HoldItemPortal';

interface HoldItemModalProps extends HoldItemPortalProps {
  visible: SharedValue<boolean>;
}

export const HoldItemModal = memo(function HoldItemModal({
  visible,
  ...props
}: HoldItemModalProps) {
  const { state } = useHoldItem();

  const [mounted, setMount] = useState(visible.value);
  const unMount = useCallback(() => {
    setTimeout(() => {
      setMount(false);
    }, HOLD_ITEM_TRANSFORM_DURATION + 50);
  }, []);

  useAnimatedReaction(
    () => ({
      state: state.value,
      visible: visible.value,
    }),
    (value, prev) => {
      if (value.visible && prev?.visible !== value.visible) {
        runOnJS(setMount)(true);
      }
      if (
        value.state === CONTEXT_MENU_STATE.END &&
        prev?.state !== value.state
      ) {
        runOnJS(unMount)();
      }
    },
    []
  );

  return mounted ? <HoldItemPortal {...props} /> : null;
});
