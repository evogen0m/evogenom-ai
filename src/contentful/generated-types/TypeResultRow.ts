import type {
  ChainModifiers,
  Entry,
  EntryFieldTypes,
  EntrySkeletonType,
  LocaleCode,
} from 'contentful';

export interface TypeResultRowFields {
  highlightedInPackage?: EntryFieldTypes.Object;
  productCode: EntryFieldTypes.Symbol;
  result: EntryFieldTypes.Integer;
  classification?: EntryFieldTypes.Symbol;
  resultText: EntryFieldTypes.Symbol;
  tip?: EntryFieldTypes.Text;
  fact?: EntryFieldTypes.Text;
  science?: EntryFieldTypes.Text;
  tipImage?: EntryFieldTypes.AssetLink;
  resultImage?: EntryFieldTypes.AssetLink;
}

export type TypeResultRowSkeleton = EntrySkeletonType<
  TypeResultRowFields,
  'resultRow'
>;
export type TypeResultRow<
  Modifiers extends ChainModifiers,
  Locales extends LocaleCode = LocaleCode,
> = Entry<TypeResultRowSkeleton, Modifiers, Locales>;

export function isTypeResultRow<
  Modifiers extends ChainModifiers,
  Locales extends LocaleCode,
>(
  entry: Entry<EntrySkeletonType, Modifiers, Locales>,
): entry is TypeResultRow<Modifiers, Locales> {
  return entry.sys.contentType.sys.id === 'resultRow';
}
