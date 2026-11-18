import English from '@/localizations/en/translation.json';
import Spanish from '@/localizations/es/translation.json';

function leaves(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value };
  if (typeof value !== 'object' || value === null)
    throw new Error(`Invalid resource at ${prefix}`);
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) =>
      Object.entries(leaves(child, prefix ? `${prefix}.${key}` : key)),
    ),
  );
}

const english = leaves(English);
const spanish = leaves(Spanish);

test('Spanish covers every bundled English key with nonempty content', () => {
  expect(Object.keys(spanish).sort()).toEqual(Object.keys(english).sort());
  expect(Object.entries(spanish).filter(([, value]) => !value.trim())).toEqual(
    [],
  );
});

test('Spanish preserves interpolation variables and rich-text tags for every key', () => {
  const tokens = (value: string) =>
    (value.match(/\{\{[^}]+\}\}|<\/?[a-zA-Z][^>]*>/g) ?? []).sort();
  const mismatches = Object.keys(english).filter(
    key =>
      JSON.stringify(tokens(english[key])) !==
      JSON.stringify(tokens(spanish[key] ?? '')),
  );
  expect(mismatches).toEqual([]);
});
