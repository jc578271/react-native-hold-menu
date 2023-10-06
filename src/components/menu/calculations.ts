import {
  MENU_TEXT_DARK_COLOR,
  MENU_TEXT_DESTRUCTIVE_COLOR_DARK,
  MENU_TEXT_DESTRUCTIVE_COLOR_LIGHT,
  MENU_TEXT_LIGHT_COLOR,
  MENU_TITLE_COLOR,
} from './constants';
import { TransformOriginAnchorPosition } from '../../utils/calculations';

export const leftOrRight = (
  menuAnchorPosition: TransformOriginAnchorPosition,
  itemWidth: number,
  menuWidth: number
) => {
  'worklet';

  const anchorPositionHorizontal = menuAnchorPosition.split('-')[1];

  let leftPosition = 0;
  anchorPositionHorizontal === 'right'
    ? (leftPosition = -menuWidth + itemWidth)
    : anchorPositionHorizontal === 'left'
    ? (leftPosition = 0)
    : (leftPosition = -itemWidth - menuWidth / 2 + itemWidth / 2);

  return leftPosition;
};

export const getColor = (
  isTitle: boolean | undefined,
  isDestructive: boolean | undefined,
  themeValue: 'light' | 'dark'
) => {
  'worklet';
  return isTitle
    ? MENU_TITLE_COLOR
    : isDestructive
    ? themeValue === 'dark'
      ? MENU_TEXT_DESTRUCTIVE_COLOR_DARK
      : MENU_TEXT_DESTRUCTIVE_COLOR_LIGHT
    : themeValue === 'dark'
    ? MENU_TEXT_DARK_COLOR
    : MENU_TEXT_LIGHT_COLOR;
};
