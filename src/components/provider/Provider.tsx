import React, {memo, useMemo} from 'react';
import {PortalProvider} from '@gorhom/portal';

// Components
// Utils
import {InternalContext} from '../../context/internal';
import {HoldMenuProviderProps} from './types';
import {Action, StateProps} from './reducer';

export interface Store {
  state: StateProps;
  dispatch?: React.Dispatch<Action>;
}

export let AnimatedIcon: any;

const ProviderComponent = ({
  children,
}: HoldMenuProviderProps) => {
  // if (iconComponent)
  //   AnimatedIcon = Animated.createAnimatedComponent(iconComponent);
  //
  // const state = useSharedValue<CONTEXT_MENU_STATE>(
  //   CONTEXT_MENU_STATE.UNDETERMINED
  // );
  // const theme = useSharedValue<'light' | 'dark'>(selectedTheme || 'light');
  //
  // useEffect(() => {
  //   theme.value = selectedTheme || 'light';
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [selectedTheme]);
  //
  // useAnimatedReaction(
  //   () => state.value,
  //   state => {
  //     switch (state) {
  //       case CONTEXT_MENU_STATE.ACTIVE: {
  //         if (onOpen) runOnJS(onOpen)();
  //         break;
  //       }
  //       case CONTEXT_MENU_STATE.END: {
  //         if (onClose) runOnJS(onClose)();
  //         break;
  //       }
  //     }
  //   },
  //   [state]
  // );

  const internalContextVariables = useMemo(
    () => ({
      // state,
      // theme,
      // safeAreaInsets: safeAreaInsets || {
      //   top: 0,
      //   bottom: 0,
      //   left: 0,
      //   right: 0,
      // },
    }),
    []
  );

  return (
    <InternalContext.Provider value={internalContextVariables}>
        <PortalProvider>
          {children}
        </PortalProvider>
    </InternalContext.Provider>
  );
};

const Provider = memo(ProviderComponent);

export default Provider;
