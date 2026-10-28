import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import { AuthManager } from './AuthSlice';
import { ThemeManager } from './ThemeSlice';
import { GeneralManager } from './GeneralSlice';

const generalPersistConfig = {
  key: 'general',
  storage: AsyncStorage,
  blacklist: [], // ❌ these won't persist
};

const reducers = combineReducers({
  AuthManager,
  ThemeManager,
  GeneralManager: persistReducer(generalPersistConfig, GeneralManager),
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['AuthManager', 'ThemeManager', 'GeneralManager'],
  blacklist: [],
};

const persistedReducer = persistReducer(persistConfig, reducers);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
const persistor = persistStore(store);

export { store, persistor };
