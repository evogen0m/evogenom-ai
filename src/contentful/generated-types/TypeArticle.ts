import type {
  ChainModifiers,
  Entry,
  EntryFieldTypes,
  EntrySkeletonType,
  LocaleCode,
} from 'contentful';

export interface TypeArticleFields {
  image?: EntryFieldTypes.AssetLink;
  summary?: EntryFieldTypes.Symbol;
  date?: EntryFieldTypes.Date;
  subtitle?: EntryFieldTypes.Text;
  content?: EntryFieldTypes.Text;
  breadtext?: EntryFieldTypes.RichText;
}

export type TypeArticleSkeleton = EntrySkeletonType<
  TypeArticleFields,
  'article'
>;
export type TypeArticle<
  Modifiers extends ChainModifiers,
  Locales extends LocaleCode = LocaleCode,
> = Entry<TypeArticleSkeleton, Modifiers, Locales>;

export function isTypeArticle<
  Modifiers extends ChainModifiers,
  Locales extends LocaleCode,
>(
  entry: Entry<EntrySkeletonType, Modifiers, Locales>,
): entry is TypeArticle<Modifiers, Locales> {
  return entry.sys.contentType.sys.id === 'article';
}
