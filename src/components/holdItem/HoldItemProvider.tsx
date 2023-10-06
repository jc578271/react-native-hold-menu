import React, { memo, PropsWithChildren, useMemo } from 'react';
import { HoldItemContext } from './context';
import { useSharedValue } from 'react-native-reanimated';
import { TransformOriginAnchorPosition } from '../../utils/calculations';

export const HoldItemProvider = memo(function HoldItemProvider({
  children,
}: PropsWithChildren) {
  const currentId = useSharedValue<string | undefined>(undefined);

  const itemRectY = useSharedValue<number>(0);
  const itemRectX = useSharedValue<number>(0);
  const itemRectWidth = useSharedValue<number>(0);
  const itemRectHeight = useSharedValue<number>(0);
  const itemScale = useSharedValue<number>(1);
  const transformValue = useSharedValue<number>(0);

  const transformOrigin = useSharedValue<TransformOriginAnchorPosition>(
    'top-right'
  );
  const visible = useSharedValue<boolean>(false);
  const menuHeight = useSharedValue<number>(0);
  const animatedActiveId = useSharedValue<string | undefined>(undefined);

  const returnValue = useMemo(
    () => ({
      currentId,
      itemRectY,
      itemRectX,
      itemRectWidth,
      itemRectHeight,
      itemScale,
      transformValue,
      transformOrigin,
      menuHeight,
      visible,
      animatedActiveId,
    }),
    []
  );

  return (
    <HoldItemContext.Provider value={returnValue}>
      {children}
    </HoldItemContext.Provider>
  );
});
