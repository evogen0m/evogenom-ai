import type {
  ChainModifiers,
  Entry,
  EntryFieldTypes,
  EntrySkeletonType,
  LocaleCode,
} from 'contentful';

export interface TypeNotificationsFields {
  notificationTranslations?: EntryFieldTypes.Object;
}

export type TypeNotificationsSkeleton = EntrySkeletonType<
  TypeNotificationsFields,
  'notifications'
>;
export type TypeNotifications<
  Modifiers extends ChainModifiers,
  Locales extends LocaleCode = LocaleCode,
> = Entry<TypeNotificationsSkeleton, Modifiers, Locales>;

export function isTypeNotifications<
  Modifiers extends ChainModifiers,
  Locales extends LocaleCode,
>(
  entry: Entry<EntrySkeletonType, Modifiers, Locales>,
): entry is TypeNotifications<Modifiers, Locales> {
  return entry.sys.contentType.sys.id === 'notifications';
}
