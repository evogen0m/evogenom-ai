import type {
  ChainModifiers,
  Entry,
  EntryFieldTypes,
  EntrySkeletonType,
  LocaleCode,
} from 'contentful';

export interface TypeDialogFields {
  id: EntryFieldTypes.Symbol;
  title?: EntryFieldTypes.Symbol;
  message?: EntryFieldTypes.Text;
}

export type TypeDialogSkeleton = EntrySkeletonType<TypeDialogFields, 'dialog'>;
export type TypeDialog<
  Modifiers extends ChainModifiers,
  Locales extends LocaleCode = LocaleCode,
> = Entry<TypeDialogSkeleton, Modifiers, Locales>;

export function isTypeDialog<
  Modifiers extends ChainModifiers,
  Locales extends LocaleCode,
>(
  entry: Entry<EntrySkeletonType, Modifiers, Locales>,
): entry is TypeDialog<Modifiers, Locales> {
  return entry.sys.contentType.sys.id === 'dialog';
}
