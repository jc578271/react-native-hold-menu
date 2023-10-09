import React, { memo, useMemo, useState } from 'react';

// Components
// Utils
import { InternalContext } from '../../context/internal';
import { HoldMenuProviderProps } from './types';
import { useSharedValue } from 'react-native-reanimated';
import { CONTEXT_MENU_STATE } from '../../constants';
import { TransformOriginAnchorPosition } from '../../utils/calculations';

const ProviderComponent = ({ children }: HoldMenuProviderProps) => {
  //#region hooks
  const currentId = useSharedValue(undefined);
  const state = useSharedValue<CONTEXT_MENU_STATE>(
    CONTEXT_MENU_STATE.UNDETERMINED
  );

  const [renderChildren, setRenderChildren] = useState<JSX.Element | null>(
    null
  );

  const itemRectY = useSharedValue<number>(0);
  const itemRectX = useSharedValue<number>(0);
  const itemRectWidth = useSharedValue<number>(0);
  const itemRectHeight = useSharedValue<number>(0);
  const itemScale = useSharedValue<number>(1);

  const transformOrigin = useSharedValue<TransformOriginAnchorPosition>(
    'top-left'
  );

  const menuHeight = useSharedValue<number>(0);
  const menuWidth = useSharedValue<number>(0);

  const internalContextVariables = useMemo(
    () => ({
      currentId,
      renderChildren,
      setRenderChildren,
      itemRectY,
      itemRectX,
      itemRectWidth,
      itemRectHeight,
      itemScale,
      transformOrigin,
      menuHeight,
      menuWidth,
      state,
    }),
    []
  );

  return (
    <InternalContext.Provider value={internalContextVariables}>
      {children}
    </InternalContext.Provider>
  );
};

export const HoldMenuProvider = memo(ProviderComponent);
