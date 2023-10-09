import { WINDOW_HEIGHT, WINDOW_WIDTH } from '../constants';
import styleGuide from '../styleGuide';
import { TransformOriginAnchorPosition } from './calculations';

export const calculateTransformValue = ({
  deviceOrientation,
  transformOrigin,
  disableMove,
  itemRectY,
  itemRectHeight,
  menuHeight,
  safeAreaInsets,
}: {
  deviceOrientation: 'landscape' | 'portrait';
  transformOrigin: TransformOriginAnchorPosition;
  disableMove?: boolean;
  itemRectY: number;
  itemRectHeight: number;
  menuHeight: number;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}) => {
  'worklet';

  const height =
    deviceOrientation === 'portrait' ? WINDOW_HEIGHT : WINDOW_WIDTH;

  const isAnchorPointTop = transformOrigin.includes('top');

  let tY = 0;
  if (!disableMove) {
    if (isAnchorPointTop) {
      const topTransform =
        itemRectY +
        itemRectHeight +
        menuHeight +
        styleGuide.spacing +
        (safeAreaInsets?.bottom || 0);

      tY = topTransform > height ? height - topTransform : 0;
    } else {
      const bottomTransform =
        itemRectY - menuHeight - (safeAreaInsets?.top || 0);
      tY = bottomTransform < 0 ? -bottomTransform + styleGuide.spacing * 2 : 0;
    }
  }
  return tY;
};
