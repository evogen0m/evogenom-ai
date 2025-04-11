import type {
  ChainModifiers,
  Entry,
  EntryFieldTypes,
  EntrySkeletonType,
  LocaleCode,
} from 'contentful';

export interface TypePackageFields {
  name: EntryFieldTypes.Symbol;
  subtitle?: EntryFieldTypes.Symbol;
  packageCode: EntryFieldTypes.Integer;
}

export type TypePackageSkeleton = EntrySkeletonType<
  TypePackageFields,
  'package'
>;
export type TypePackage<
  Modifiers extends ChainModifiers,
  Locales extends LocaleCode = LocaleCode,
> = Entry<TypePackageSkeleton, Modifiers, Locales>;

export function isTypePackage<
  Modifiers extends ChainModifiers,
  Locales extends LocaleCode,
>(
  entry: Entry<EntrySkeletonType, Modifiers, Locales>,
): entry is TypePackage<Modifiers, Locales> {
  return entry.sys.contentType.sys.id === 'package';
}
