import { useSharedValue } from 'react-native-reanimated';
import { CONTEXT_MENU_STATE } from '../constants';
import { TransformOriginAnchorPosition } from '../utils/calculations';

export const useInitValue = ({
  menuAnchorPosition,
}: {
  menuAnchorPosition?: TransformOriginAnchorPosition;
}) => {
  //#region hooks
  const state = useSharedValue<CONTEXT_MENU_STATE>(
    CONTEXT_MENU_STATE.UNDETERMINED
  );

  const itemRectY = useSharedValue<number>(0);
  const itemRectX = useSharedValue<number>(0);
  const itemRectWidth = useSharedValue<number>(0);
  const itemRectHeight = useSharedValue<number>(0);
  const itemScale = useSharedValue<number>(1);

  const transformOrigin = useSharedValue<TransformOriginAnchorPosition>(
    menuAnchorPosition || 'top-left'
  );

  const menuHeight = useSharedValue<number>(0);
  const menuWidth = useSharedValue<number>(0);

  return {
    itemRectY,
    itemRectX,
    itemRectWidth,
    itemRectHeight,
    itemScale,
    transformOrigin,
    menuHeight,
    menuWidth,
    state,
  };
};
