import { TOptions } from 'i18next';
import { useTranslation } from 'react-i18next';
import English from '@/localizations/en/translation.json';

type LeafKeys<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : `${K}.${LeafKeys<T[K]>}`;
}[keyof T & string];

type ResourceKey = LeafKeys<typeof English>;
type PluralBase<K> = K extends `${infer Base}_one` | `${infer Base}_other`
  ? Base
  : never;
export type TranslationKey = ResourceKey | PluralBase<ResourceKey>;

/** Typed keys for new features; legacy useTranslation imports remain valid. */
export function useAppTranslation() {
  const { t, i18n, ready } = useTranslation();
  return {
    t: (key: TranslationKey, options?: TOptions): string => t(key, options),
    i18n,
    ready,
  };
}
