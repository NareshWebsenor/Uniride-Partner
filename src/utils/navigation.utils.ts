import {
  CommonActions,
  createNavigationContainerRef,
  DrawerActions,
} from '@react-navigation/native';

import { TRootStack } from '../interface/navigation.type';

export const navigationRef = createNavigationContainerRef<TRootStack>();

/* -------------------------------------------------------------------------- */
/*                               Typed Navigate                               */
/* -------------------------------------------------------------------------- */

export function navigate<T extends keyof TRootStack>(
  name: T,
  params?: TRootStack[T],
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.navigate({ name, params }));
  }
}

export const navigateBack = () => {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  }
};

/* -------------------------------------------------------------------------- */
/*                                Reset Navigate                               */
/* -------------------------------------------------------------------------- */

export function navigateAndReset(
  routes: Array<{ name: keyof TRootStack; params?: any }>,
  index = 0,
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index,
        routes,
      }),
    );
  }
}

export function navigateAndSimpleReset<T extends keyof TRootStack>(
  name: T,
  params?: TRootStack[T],
  index = 0,
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index,
        routes: [{ name, params }],
      }),
    );
  }
}

export function resetToNestedScreen<
  T extends keyof TRootStack,
  S extends string,
>(parent: T, screen: S, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: parent,
            state: {
              index: 0,
              routes: [{ name: screen, params }],
            },
          },
        ],
      }),
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                               Drawer Functions                              */
/* -------------------------------------------------------------------------- */

export const openDrawer = () => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(DrawerActions.openDrawer());
  }
};

export const closeDrawer = () => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(DrawerActions.closeDrawer());
  }
};

export const toggleDrawer = () => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(DrawerActions.toggleDrawer());
  }
};
