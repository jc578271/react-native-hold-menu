import React from 'react';

import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import MenuList from './MenuList';

import styles from './styles';
import { useInternal } from '../../hooks';
import {
  HOLD_ITEM_TRANSFORM_DURATION,
  CONTEXT_MENU_STATE,
  SPRING_CONFIGURATION,
} from '../../constants';
import { TransformOriginAnchorPosition } from '../../utils/calculations';
import { useHoldItem } from '../holdItem/context';

interface MenuProps {
  menuAnchorPosition?: TransformOriginAnchorPosition;
  children: any;
}

const MenuComponent = ({
  menuAnchorPosition = 'top-left',
  children,
}: MenuProps) => {
  const { state } = useInternal();
  const {
    itemRectX,
    itemRectY,
    itemRectHeight,
    itemRectWidth,
    transformValue,
  } = useHoldItem();

  const wrapperStyles = useAnimatedStyle(() => {
    const anchorPositionVertical = menuAnchorPosition.split('-')[0];

    const top =
      anchorPositionVertical === 'top'
        ? itemRectHeight.value + itemRectY.value + 8
        : itemRectY.value - 8;
    const left = itemRectX.value;
    const width = itemRectWidth.value;
    const tY = transformValue.value;

    return {
      top,
      left,
      width,
      transform: [
        {
          translateY:
            state.value === CONTEXT_MENU_STATE.ACTIVE
              ? withSpring(tY, SPRING_CONFIGURATION)
              : withTiming(0, { duration: HOLD_ITEM_TRANSFORM_DURATION }),
        },
      ],
    };
  }, []);

  return (
    <Animated.View style={[styles.menuWrapper, wrapperStyles]}>
      <MenuList menuAnchorPosition={menuAnchorPosition}>{children}</MenuList>
    </Animated.View>
  );
};

const Menu = React.memo(MenuComponent);

export default Menu;
