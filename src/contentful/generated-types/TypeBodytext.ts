import type {
  ChainModifiers,
  Entry,
  EntryFieldTypes,
  EntrySkeletonType,
  LocaleCode,
} from 'contentful';

export interface TypeBodytextFields {
  title?: EntryFieldTypes.Symbol;
  content?: EntryFieldTypes.RichText;
}

export type TypeBodytextSkeleton = EntrySkeletonType<
  TypeBodytextFields,
  'bodytext'
>;
export type TypeBodytext<
  Modifiers extends ChainModifiers,
  Locales extends LocaleCode = LocaleCode,
> = Entry<TypeBodytextSkeleton, Modifiers, Locales>;

export function isTypeBodytext<
  Modifiers extends ChainModifiers,
  Locales extends LocaleCode,
>(
  entry: Entry<EntrySkeletonType, Modifiers, Locales>,
): entry is TypeBodytext<Modifiers, Locales> {
  return entry.sys.contentType.sys.id === 'bodytext';
}
