import { GraphQLClient, RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  Dimension: { input: any; output: any; }
  HexColor: { input: any; output: any; }
  JSON: { input: any; output: any; }
  Quality: { input: any; output: any; }
};

/** Article content type [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/article) */
export type Article = Entry & _Node & {
  __typename?: 'Article';
  _id: Scalars['ID']['output'];
  breadtext: Maybe<ArticleBreadtext>;
  content: Maybe<Scalars['String']['output']>;
  contentfulMetadata: ContentfulMetadata;
  date: Maybe<Scalars['DateTime']['output']>;
  image: Maybe<Asset>;
  linkedFrom: Maybe<ArticleLinkingCollections>;
  subtitle: Maybe<Scalars['String']['output']>;
  summary: Maybe<Scalars['String']['output']>;
  sys: Sys;
};


/** Article content type [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/article) */
export type ArticleBreadtextArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Article content type [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/article) */
export type ArticleContentArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Article content type [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/article) */
export type ArticleDateArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Article content type [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/article) */
export type ArticleImageArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
};


/** Article content type [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/article) */
export type ArticleLinkedFromArgs = {
  allowedLocales: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** Article content type [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/article) */
export type ArticleSubtitleArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Article content type [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/article) */
export type ArticleSummaryArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};

export type ArticleBreadtext = {
  __typename?: 'ArticleBreadtext';
  json: Scalars['JSON']['output'];
  links: ArticleBreadtextLinks;
};

export type ArticleBreadtextAssets = {
  __typename?: 'ArticleBreadtextAssets';
  block: Array<Maybe<Asset>>;
  hyperlink: Array<Maybe<Asset>>;
};

export type ArticleBreadtextEntries = {
  __typename?: 'ArticleBreadtextEntries';
  block: Array<Maybe<Entry>>;
  hyperlink: Array<Maybe<Entry>>;
  inline: Array<Maybe<Entry>>;
};

export type ArticleBreadtextLinks = {
  __typename?: 'ArticleBreadtextLinks';
  assets: ArticleBreadtextAssets;
  entries: ArticleBreadtextEntries;
  resources: ArticleBreadtextResources;
};

export type ArticleBreadtextResources = {
  __typename?: 'ArticleBreadtextResources';
  block: Array<ArticleBreadtextResourcesBlock>;
  hyperlink: Array<ArticleBreadtextResourcesHyperlink>;
  inline: Array<ArticleBreadtextResourcesInline>;
};

export type ArticleBreadtextResourcesBlock = ResourceLink & {
  __typename?: 'ArticleBreadtextResourcesBlock';
  sys: ResourceSys;
};

export type ArticleBreadtextResourcesHyperlink = ResourceLink & {
  __typename?: 'ArticleBreadtextResourcesHyperlink';
  sys: ResourceSys;
};

export type ArticleBreadtextResourcesInline = ResourceLink & {
  __typename?: 'ArticleBreadtextResourcesInline';
  sys: ResourceSys;
};

export type ArticleCollection = {
  __typename?: 'ArticleCollection';
  items: Array<Maybe<Article>>;
  limit: Scalars['Int']['output'];
  skip: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type ArticleFilter = {
  AND: InputMaybe<Array<InputMaybe<ArticleFilter>>>;
  OR: InputMaybe<Array<InputMaybe<ArticleFilter>>>;
  breadtext_contains: InputMaybe<Scalars['String']['input']>;
  breadtext_exists: InputMaybe<Scalars['Boolean']['input']>;
  breadtext_not_contains: InputMaybe<Scalars['String']['input']>;
  content: InputMaybe<Scalars['String']['input']>;
  content_contains: InputMaybe<Scalars['String']['input']>;
  content_exists: InputMaybe<Scalars['Boolean']['input']>;
  content_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  content_not: InputMaybe<Scalars['String']['input']>;
  content_not_contains: InputMaybe<Scalars['String']['input']>;
  content_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contentfulMetadata: InputMaybe<ContentfulMetadataFilter>;
  date: InputMaybe<Scalars['DateTime']['input']>;
  date_exists: InputMaybe<Scalars['Boolean']['input']>;
  date_gt: InputMaybe<Scalars['DateTime']['input']>;
  date_gte: InputMaybe<Scalars['DateTime']['input']>;
  date_in: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  date_lt: InputMaybe<Scalars['DateTime']['input']>;
  date_lte: InputMaybe<Scalars['DateTime']['input']>;
  date_not: InputMaybe<Scalars['DateTime']['input']>;
  date_not_in: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  image_exists: InputMaybe<Scalars['Boolean']['input']>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  subtitle_contains: InputMaybe<Scalars['String']['input']>;
  subtitle_exists: InputMaybe<Scalars['Boolean']['input']>;
  subtitle_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  subtitle_not: InputMaybe<Scalars['String']['input']>;
  subtitle_not_contains: InputMaybe<Scalars['String']['input']>;
  subtitle_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  summary: InputMaybe<Scalars['String']['input']>;
  summary_contains: InputMaybe<Scalars['String']['input']>;
  summary_exists: InputMaybe<Scalars['Boolean']['input']>;
  summary_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  summary_not: InputMaybe<Scalars['String']['input']>;
  summary_not_contains: InputMaybe<Scalars['String']['input']>;
  summary_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sys: InputMaybe<SysFilter>;
};

export type ArticleLinkingCollections = {
  __typename?: 'ArticleLinkingCollections';
  entryCollection: Maybe<EntryCollection>;
};


export type ArticleLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export enum ArticleOrder {
  DateAsc = 'date_ASC',
  DateDesc = 'date_DESC',
  SummaryAsc = 'summary_ASC',
  SummaryDesc = 'summary_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC'
}

/** Represents a binary file in a space. An asset can be any file type. */
export type Asset = {
  __typename?: 'Asset';
  contentType: Maybe<Scalars['String']['output']>;
  contentfulMetadata: ContentfulMetadata;
  description: Maybe<Scalars['String']['output']>;
  fileName: Maybe<Scalars['String']['output']>;
  height: Maybe<Scalars['Int']['output']>;
  linkedFrom: Maybe<AssetLinkingCollections>;
  size: Maybe<Scalars['Int']['output']>;
  sys: Sys;
  title: Maybe<Scalars['String']['output']>;
  url: Maybe<Scalars['String']['output']>;
  width: Maybe<Scalars['Int']['output']>;
};


/** Represents a binary file in a space. An asset can be any file type. */
export type AssetContentTypeArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Represents a binary file in a space. An asset can be any file type. */
export type AssetDescriptionArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Represents a binary file in a space. An asset can be any file type. */
export type AssetFileNameArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Represents a binary file in a space. An asset can be any file type. */
export type AssetHeightArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Represents a binary file in a space. An asset can be any file type. */
export type AssetLinkedFromArgs = {
  allowedLocales: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** Represents a binary file in a space. An asset can be any file type. */
export type AssetSizeArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Represents a binary file in a space. An asset can be any file type. */
export type AssetTitleArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Represents a binary file in a space. An asset can be any file type. */
export type AssetUrlArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  transform: InputMaybe<ImageTransformOptions>;
};


/** Represents a binary file in a space. An asset can be any file type. */
export type AssetWidthArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};

export type AssetCollection = {
  __typename?: 'AssetCollection';
  items: Array<Maybe<Asset>>;
  limit: Scalars['Int']['output'];
  skip: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type AssetFilter = {
  AND: InputMaybe<Array<InputMaybe<AssetFilter>>>;
  OR: InputMaybe<Array<InputMaybe<AssetFilter>>>;
  contentType: InputMaybe<Scalars['String']['input']>;
  contentType_contains: InputMaybe<Scalars['String']['input']>;
  contentType_exists: InputMaybe<Scalars['Boolean']['input']>;
  contentType_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contentType_not: InputMaybe<Scalars['String']['input']>;
  contentType_not_contains: InputMaybe<Scalars['String']['input']>;
  contentType_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contentfulMetadata: InputMaybe<ContentfulMetadataFilter>;
  description: InputMaybe<Scalars['String']['input']>;
  description_contains: InputMaybe<Scalars['String']['input']>;
  description_exists: InputMaybe<Scalars['Boolean']['input']>;
  description_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  description_not: InputMaybe<Scalars['String']['input']>;
  description_not_contains: InputMaybe<Scalars['String']['input']>;
  description_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fileName: InputMaybe<Scalars['String']['input']>;
  fileName_contains: InputMaybe<Scalars['String']['input']>;
  fileName_exists: InputMaybe<Scalars['Boolean']['input']>;
  fileName_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fileName_not: InputMaybe<Scalars['String']['input']>;
  fileName_not_contains: InputMaybe<Scalars['String']['input']>;
  fileName_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  height: InputMaybe<Scalars['Int']['input']>;
  height_exists: InputMaybe<Scalars['Boolean']['input']>;
  height_gt: InputMaybe<Scalars['Int']['input']>;
  height_gte: InputMaybe<Scalars['Int']['input']>;
  height_in: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  height_lt: InputMaybe<Scalars['Int']['input']>;
  height_lte: InputMaybe<Scalars['Int']['input']>;
  height_not: InputMaybe<Scalars['Int']['input']>;
  height_not_in: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  size: InputMaybe<Scalars['Int']['input']>;
  size_exists: InputMaybe<Scalars['Boolean']['input']>;
  size_gt: InputMaybe<Scalars['Int']['input']>;
  size_gte: InputMaybe<Scalars['Int']['input']>;
  size_in: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  size_lt: InputMaybe<Scalars['Int']['input']>;
  size_lte: InputMaybe<Scalars['Int']['input']>;
  size_not: InputMaybe<Scalars['Int']['input']>;
  size_not_in: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  sys: InputMaybe<SysFilter>;
  title: InputMaybe<Scalars['String']['input']>;
  title_contains: InputMaybe<Scalars['String']['input']>;
  title_exists: InputMaybe<Scalars['Boolean']['input']>;
  title_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  title_not: InputMaybe<Scalars['String']['input']>;
  title_not_contains: InputMaybe<Scalars['String']['input']>;
  title_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  url: InputMaybe<Scalars['String']['input']>;
  url_contains: InputMaybe<Scalars['String']['input']>;
  url_exists: InputMaybe<Scalars['Boolean']['input']>;
  url_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  url_not: InputMaybe<Scalars['String']['input']>;
  url_not_contains: InputMaybe<Scalars['String']['input']>;
  url_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  width: InputMaybe<Scalars['Int']['input']>;
  width_exists: InputMaybe<Scalars['Boolean']['input']>;
  width_gt: InputMaybe<Scalars['Int']['input']>;
  width_gte: InputMaybe<Scalars['Int']['input']>;
  width_in: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  width_lt: InputMaybe<Scalars['Int']['input']>;
  width_lte: InputMaybe<Scalars['Int']['input']>;
  width_not: InputMaybe<Scalars['Int']['input']>;
  width_not_in: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
};

export type AssetLinkingCollections = {
  __typename?: 'AssetLinkingCollections';
  articleCollection: Maybe<ArticleCollection>;
  entryCollection: Maybe<EntryCollection>;
  resultRowCollection: Maybe<ResultRowCollection>;
};


export type AssetLinkingCollectionsArticleCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type AssetLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type AssetLinkingCollectionsResultRowCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export enum AssetOrder {
  ContentTypeAsc = 'contentType_ASC',
  ContentTypeDesc = 'contentType_DESC',
  FileNameAsc = 'fileName_ASC',
  FileNameDesc = 'fileName_DESC',
  HeightAsc = 'height_ASC',
  HeightDesc = 'height_DESC',
  SizeAsc = 'size_ASC',
  SizeDesc = 'size_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC',
  UrlAsc = 'url_ASC',
  UrlDesc = 'url_DESC',
  WidthAsc = 'width_ASC',
  WidthDesc = 'width_DESC'
}

/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/bodytext) */
export type Bodytext = Entry & _Node & {
  __typename?: 'Bodytext';
  _id: Scalars['ID']['output'];
  content: Maybe<BodytextContent>;
  contentfulMetadata: ContentfulMetadata;
  linkedFrom: Maybe<BodytextLinkingCollections>;
  sys: Sys;
  title: Maybe<Scalars['String']['output']>;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/bodytext) */
export type BodytextContentArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/bodytext) */
export type BodytextLinkedFromArgs = {
  allowedLocales: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/bodytext) */
export type BodytextTitleArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};

export type BodytextCollection = {
  __typename?: 'BodytextCollection';
  items: Array<Maybe<Bodytext>>;
  limit: Scalars['Int']['output'];
  skip: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type BodytextContent = {
  __typename?: 'BodytextContent';
  json: Scalars['JSON']['output'];
  links: BodytextContentLinks;
};

export type BodytextContentAssets = {
  __typename?: 'BodytextContentAssets';
  block: Array<Maybe<Asset>>;
  hyperlink: Array<Maybe<Asset>>;
};

export type BodytextContentEntries = {
  __typename?: 'BodytextContentEntries';
  block: Array<Maybe<Entry>>;
  hyperlink: Array<Maybe<Entry>>;
  inline: Array<Maybe<Entry>>;
};

export type BodytextContentLinks = {
  __typename?: 'BodytextContentLinks';
  assets: BodytextContentAssets;
  entries: BodytextContentEntries;
  resources: BodytextContentResources;
};

export type BodytextContentResources = {
  __typename?: 'BodytextContentResources';
  block: Array<BodytextContentResourcesBlock>;
  hyperlink: Array<BodytextContentResourcesHyperlink>;
  inline: Array<BodytextContentResourcesInline>;
};

export type BodytextContentResourcesBlock = ResourceLink & {
  __typename?: 'BodytextContentResourcesBlock';
  sys: ResourceSys;
};

export type BodytextContentResourcesHyperlink = ResourceLink & {
  __typename?: 'BodytextContentResourcesHyperlink';
  sys: ResourceSys;
};

export type BodytextContentResourcesInline = ResourceLink & {
  __typename?: 'BodytextContentResourcesInline';
  sys: ResourceSys;
};

export type BodytextFilter = {
  AND: InputMaybe<Array<InputMaybe<BodytextFilter>>>;
  OR: InputMaybe<Array<InputMaybe<BodytextFilter>>>;
  content_contains: InputMaybe<Scalars['String']['input']>;
  content_exists: InputMaybe<Scalars['Boolean']['input']>;
  content_not_contains: InputMaybe<Scalars['String']['input']>;
  contentfulMetadata: InputMaybe<ContentfulMetadataFilter>;
  sys: InputMaybe<SysFilter>;
  title: InputMaybe<Scalars['String']['input']>;
  title_contains: InputMaybe<Scalars['String']['input']>;
  title_exists: InputMaybe<Scalars['Boolean']['input']>;
  title_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  title_not: InputMaybe<Scalars['String']['input']>;
  title_not_contains: InputMaybe<Scalars['String']['input']>;
  title_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type BodytextLinkingCollections = {
  __typename?: 'BodytextLinkingCollections';
  entryCollection: Maybe<EntryCollection>;
};


export type BodytextLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export enum BodytextOrder {
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC',
  TitleAsc = 'title_ASC',
  TitleDesc = 'title_DESC'
}

export type ContentfulMetadata = {
  __typename?: 'ContentfulMetadata';
  concepts: Array<Maybe<TaxonomyConcept>>;
  tags: Array<Maybe<ContentfulTag>>;
};

export type ContentfulMetadataConceptsDescendantsFilter = {
  id_contains_all: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_contains_none: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_contains_some: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ContentfulMetadataConceptsFilter = {
  descendants: InputMaybe<ContentfulMetadataConceptsDescendantsFilter>;
  id_contains_all: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_contains_none: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_contains_some: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ContentfulMetadataFilter = {
  concepts: InputMaybe<ContentfulMetadataConceptsFilter>;
  concepts_exists: InputMaybe<Scalars['Boolean']['input']>;
  tags: InputMaybe<ContentfulMetadataTagsFilter>;
  tags_exists: InputMaybe<Scalars['Boolean']['input']>;
};

export type ContentfulMetadataTagsFilter = {
  id_contains_all: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_contains_none: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_contains_some: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/**
 * Represents a tag entity for finding and organizing content easily.
 *       Find out more here: https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/content-tags
 */
export type ContentfulTag = {
  __typename?: 'ContentfulTag';
  id: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
};

/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/dialog) */
export type Dialog = Entry & _Node & {
  __typename?: 'Dialog';
  _id: Scalars['ID']['output'];
  contentfulMetadata: ContentfulMetadata;
  id: Maybe<Scalars['String']['output']>;
  linkedFrom: Maybe<DialogLinkingCollections>;
  message: Maybe<Scalars['String']['output']>;
  sys: Sys;
  title: Maybe<Scalars['String']['output']>;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/dialog) */
export type DialogIdArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/dialog) */
export type DialogLinkedFromArgs = {
  allowedLocales: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/dialog) */
export type DialogMessageArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/dialog) */
export type DialogTitleArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};

export type DialogCollection = {
  __typename?: 'DialogCollection';
  items: Array<Maybe<Dialog>>;
  limit: Scalars['Int']['output'];
  skip: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type DialogFilter = {
  AND: InputMaybe<Array<InputMaybe<DialogFilter>>>;
  OR: InputMaybe<Array<InputMaybe<DialogFilter>>>;
  contentfulMetadata: InputMaybe<ContentfulMetadataFilter>;
  id: InputMaybe<Scalars['String']['input']>;
  id_contains: InputMaybe<Scalars['String']['input']>;
  id_exists: InputMaybe<Scalars['Boolean']['input']>;
  id_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not: InputMaybe<Scalars['String']['input']>;
  id_not_contains: InputMaybe<Scalars['String']['input']>;
  id_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  message: InputMaybe<Scalars['String']['input']>;
  message_contains: InputMaybe<Scalars['String']['input']>;
  message_exists: InputMaybe<Scalars['Boolean']['input']>;
  message_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  message_not: InputMaybe<Scalars['String']['input']>;
  message_not_contains: InputMaybe<Scalars['String']['input']>;
  message_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sys: InputMaybe<SysFilter>;
  title: InputMaybe<Scalars['String']['input']>;
  title_contains: InputMaybe<Scalars['String']['input']>;
  title_exists: InputMaybe<Scalars['Boolean']['input']>;
  title_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  title_not: InputMaybe<Scalars['String']['input']>;
  title_not_contains: InputMaybe<Scalars['String']['input']>;
  title_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type DialogLinkingCollections = {
  __typename?: 'DialogLinkingCollections';
  entryCollection: Maybe<EntryCollection>;
};


export type DialogLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export enum DialogOrder {
  IdAsc = 'id_ASC',
  IdDesc = 'id_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC',
  TitleAsc = 'title_ASC',
  TitleDesc = 'title_DESC'
}

export type Entry = {
  contentfulMetadata: ContentfulMetadata;
  sys: Sys;
};

export type EntryCollection = {
  __typename?: 'EntryCollection';
  items: Array<Maybe<Entry>>;
  limit: Scalars['Int']['output'];
  skip: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type EntryFilter = {
  AND: InputMaybe<Array<InputMaybe<EntryFilter>>>;
  OR: InputMaybe<Array<InputMaybe<EntryFilter>>>;
  contentfulMetadata: InputMaybe<ContentfulMetadataFilter>;
  sys: InputMaybe<SysFilter>;
};

export enum EntryOrder {
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC'
}

export enum ImageFormat {
  Avif = 'AVIF',
  /** JPG image format. */
  Jpg = 'JPG',
  /**
   * Progressive JPG format stores multiple passes of an image in progressively higher detail.
   *         When a progressive image is loading, the viewer will first see a lower quality pixelated version which
   *         will gradually improve in detail, until the image is fully downloaded. This is to display an image as
   *         early as possible to make the layout look as designed.
   */
  JpgProgressive = 'JPG_PROGRESSIVE',
  /** PNG image format */
  Png = 'PNG',
  /**
   * 8-bit PNG images support up to 256 colors and weigh less than the standard 24-bit PNG equivalent.
   *         The 8-bit PNG format is mostly used for simple images, such as icons or logos.
   */
  Png8 = 'PNG8',
  /** WebP image format. */
  Webp = 'WEBP'
}

export enum ImageResizeFocus {
  /** Focus the resizing on the bottom. */
  Bottom = 'BOTTOM',
  /** Focus the resizing on the bottom left. */
  BottomLeft = 'BOTTOM_LEFT',
  /** Focus the resizing on the bottom right. */
  BottomRight = 'BOTTOM_RIGHT',
  /** Focus the resizing on the center. */
  Center = 'CENTER',
  /** Focus the resizing on the largest face. */
  Face = 'FACE',
  /** Focus the resizing on the area containing all the faces. */
  Faces = 'FACES',
  /** Focus the resizing on the left. */
  Left = 'LEFT',
  /** Focus the resizing on the right. */
  Right = 'RIGHT',
  /** Focus the resizing on the top. */
  Top = 'TOP',
  /** Focus the resizing on the top left. */
  TopLeft = 'TOP_LEFT',
  /** Focus the resizing on the top right. */
  TopRight = 'TOP_RIGHT'
}

export enum ImageResizeStrategy {
  /** Crops a part of the original image to fit into the specified dimensions. */
  Crop = 'CROP',
  /** Resizes the image to the specified dimensions, cropping the image if needed. */
  Fill = 'FILL',
  /** Resizes the image to fit into the specified dimensions. */
  Fit = 'FIT',
  /**
   * Resizes the image to the specified dimensions, padding the image if needed.
   *         Uses desired background color as padding color.
   */
  Pad = 'PAD',
  /** Resizes the image to the specified dimensions, changing the original aspect ratio if needed. */
  Scale = 'SCALE',
  /** Creates a thumbnail from the image. */
  Thumb = 'THUMB'
}

export type ImageTransformOptions = {
  /**
   * Desired background color, used with corner radius or `PAD` resize strategy.
   *         Defaults to transparent (for `PNG`, `PNG8` and `WEBP`) or white (for `JPG` and `JPG_PROGRESSIVE`).
   */
  backgroundColor: InputMaybe<Scalars['HexColor']['input']>;
  /**
   * Desired corner radius in pixels.
   *         Results in an image with rounded corners (pass `-1` for a full circle/ellipse).
   *         Defaults to `0`. Uses desired background color as padding color,
   *         unless the format is `JPG` or `JPG_PROGRESSIVE` and resize strategy is `PAD`, then defaults to white.
   */
  cornerRadius: InputMaybe<Scalars['Int']['input']>;
  /** Desired image format. Defaults to the original image format. */
  format: InputMaybe<ImageFormat>;
  /** Desired height in pixels. Defaults to the original image height. */
  height: InputMaybe<Scalars['Dimension']['input']>;
  /**
   * Desired quality of the image in percents.
   *         Used for `PNG8`, `JPG`, `JPG_PROGRESSIVE` and `WEBP` formats.
   */
  quality: InputMaybe<Scalars['Quality']['input']>;
  /** Desired resize focus area. Defaults to `CENTER`. */
  resizeFocus: InputMaybe<ImageResizeFocus>;
  /** Desired resize strategy. Defaults to `FIT`. */
  resizeStrategy: InputMaybe<ImageResizeStrategy>;
  /** Desired width in pixels. Defaults to the original image width. */
  width: InputMaybe<Scalars['Dimension']['input']>;
};

/** Notification translations [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/notifications) */
export type Notifications = Entry & _Node & {
  __typename?: 'Notifications';
  _id: Scalars['ID']['output'];
  contentfulMetadata: ContentfulMetadata;
  linkedFrom: Maybe<NotificationsLinkingCollections>;
  notificationTranslations: Maybe<Scalars['JSON']['output']>;
  sys: Sys;
};


/** Notification translations [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/notifications) */
export type NotificationsLinkedFromArgs = {
  allowedLocales: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** Notification translations [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/notifications) */
export type NotificationsNotificationTranslationsArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};

export type NotificationsCollection = {
  __typename?: 'NotificationsCollection';
  items: Array<Maybe<Notifications>>;
  limit: Scalars['Int']['output'];
  skip: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type NotificationsFilter = {
  AND: InputMaybe<Array<InputMaybe<NotificationsFilter>>>;
  OR: InputMaybe<Array<InputMaybe<NotificationsFilter>>>;
  contentfulMetadata: InputMaybe<ContentfulMetadataFilter>;
  notificationTranslations_exists: InputMaybe<Scalars['Boolean']['input']>;
  sys: InputMaybe<SysFilter>;
};

export type NotificationsLinkingCollections = {
  __typename?: 'NotificationsLinkingCollections';
  entryCollection: Maybe<EntryCollection>;
};


export type NotificationsLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export enum NotificationsOrder {
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC'
}

/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/package) */
export type Package = Entry & _Node & {
  __typename?: 'Package';
  _id: Scalars['ID']['output'];
  contentfulMetadata: ContentfulMetadata;
  linkedFrom: Maybe<PackageLinkingCollections>;
  name: Maybe<Scalars['String']['output']>;
  packageCode: Maybe<Scalars['Int']['output']>;
  subtitle: Maybe<Scalars['String']['output']>;
  sys: Sys;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/package) */
export type PackageLinkedFromArgs = {
  allowedLocales: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/package) */
export type PackageNameArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/package) */
export type PackagePackageCodeArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/package) */
export type PackageSubtitleArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};

export type PackageCollection = {
  __typename?: 'PackageCollection';
  items: Array<Maybe<Package>>;
  limit: Scalars['Int']['output'];
  skip: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PackageFilter = {
  AND: InputMaybe<Array<InputMaybe<PackageFilter>>>;
  OR: InputMaybe<Array<InputMaybe<PackageFilter>>>;
  contentfulMetadata: InputMaybe<ContentfulMetadataFilter>;
  name: InputMaybe<Scalars['String']['input']>;
  name_contains: InputMaybe<Scalars['String']['input']>;
  name_exists: InputMaybe<Scalars['Boolean']['input']>;
  name_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  name_not: InputMaybe<Scalars['String']['input']>;
  name_not_contains: InputMaybe<Scalars['String']['input']>;
  name_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  packageCode: InputMaybe<Scalars['Int']['input']>;
  packageCode_exists: InputMaybe<Scalars['Boolean']['input']>;
  packageCode_gt: InputMaybe<Scalars['Int']['input']>;
  packageCode_gte: InputMaybe<Scalars['Int']['input']>;
  packageCode_in: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  packageCode_lt: InputMaybe<Scalars['Int']['input']>;
  packageCode_lte: InputMaybe<Scalars['Int']['input']>;
  packageCode_not: InputMaybe<Scalars['Int']['input']>;
  packageCode_not_in: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  subtitle: InputMaybe<Scalars['String']['input']>;
  subtitle_contains: InputMaybe<Scalars['String']['input']>;
  subtitle_exists: InputMaybe<Scalars['Boolean']['input']>;
  subtitle_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  subtitle_not: InputMaybe<Scalars['String']['input']>;
  subtitle_not_contains: InputMaybe<Scalars['String']['input']>;
  subtitle_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sys: InputMaybe<SysFilter>;
};

export type PackageLinkingCollections = {
  __typename?: 'PackageLinkingCollections';
  entryCollection: Maybe<EntryCollection>;
};


export type PackageLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export enum PackageOrder {
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  PackageCodeAsc = 'packageCode_ASC',
  PackageCodeDesc = 'packageCode_DESC',
  SubtitleAsc = 'subtitle_ASC',
  SubtitleDesc = 'subtitle_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC'
}

/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/product) */
export type Product = Entry & _Node & {
  __typename?: 'Product';
  _id: Scalars['ID']['output'];
  contentfulMetadata: ContentfulMetadata;
  linkedFrom: Maybe<ProductLinkingCollections>;
  name: Maybe<Scalars['String']['output']>;
  productCode: Maybe<Scalars['Int']['output']>;
  sys: Sys;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/product) */
export type ProductLinkedFromArgs = {
  allowedLocales: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/product) */
export type ProductNameArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/product) */
export type ProductProductCodeArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};

export type ProductCollection = {
  __typename?: 'ProductCollection';
  items: Array<Maybe<Product>>;
  limit: Scalars['Int']['output'];
  skip: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type ProductFilter = {
  AND: InputMaybe<Array<InputMaybe<ProductFilter>>>;
  OR: InputMaybe<Array<InputMaybe<ProductFilter>>>;
  contentfulMetadata: InputMaybe<ContentfulMetadataFilter>;
  name: InputMaybe<Scalars['String']['input']>;
  name_contains: InputMaybe<Scalars['String']['input']>;
  name_exists: InputMaybe<Scalars['Boolean']['input']>;
  name_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  name_not: InputMaybe<Scalars['String']['input']>;
  name_not_contains: InputMaybe<Scalars['String']['input']>;
  name_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  productCode: InputMaybe<Scalars['Int']['input']>;
  productCode_exists: InputMaybe<Scalars['Boolean']['input']>;
  productCode_gt: InputMaybe<Scalars['Int']['input']>;
  productCode_gte: InputMaybe<Scalars['Int']['input']>;
  productCode_in: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  productCode_lt: InputMaybe<Scalars['Int']['input']>;
  productCode_lte: InputMaybe<Scalars['Int']['input']>;
  productCode_not: InputMaybe<Scalars['Int']['input']>;
  productCode_not_in: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  sys: InputMaybe<SysFilter>;
};

export type ProductLinkingCollections = {
  __typename?: 'ProductLinkingCollections';
  entryCollection: Maybe<EntryCollection>;
};


export type ProductLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export enum ProductOrder {
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  ProductCodeAsc = 'productCode_ASC',
  ProductCodeDesc = 'productCode_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC'
}

export type Query = {
  __typename?: 'Query';
  _node: Maybe<_Node>;
  _nodes: Array<Maybe<_Node>>;
  article: Maybe<Article>;
  articleCollection: Maybe<ArticleCollection>;
  asset: Maybe<Asset>;
  assetCollection: Maybe<AssetCollection>;
  bodytext: Maybe<Bodytext>;
  bodytextCollection: Maybe<BodytextCollection>;
  dialog: Maybe<Dialog>;
  dialogCollection: Maybe<DialogCollection>;
  entryCollection: Maybe<EntryCollection>;
  notifications: Maybe<Notifications>;
  notificationsCollection: Maybe<NotificationsCollection>;
  package: Maybe<Package>;
  packageCollection: Maybe<PackageCollection>;
  product: Maybe<Product>;
  productCollection: Maybe<ProductCollection>;
  resultRow: Maybe<ResultRow>;
  resultRowCollection: Maybe<ResultRowCollection>;
};


export type Query_NodeArgs = {
  id: Scalars['ID']['input'];
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
};


export type Query_NodesArgs = {
  ids: Array<Scalars['ID']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryArticleArgs = {
  id: Scalars['String']['input'];
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryArticleCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Array<InputMaybe<ArticleOrder>>>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where: InputMaybe<ArticleFilter>;
};


export type QueryAssetArgs = {
  id: Scalars['String']['input'];
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryAssetCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Array<InputMaybe<AssetOrder>>>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where: InputMaybe<AssetFilter>;
};


export type QueryBodytextArgs = {
  id: Scalars['String']['input'];
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryBodytextCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Array<InputMaybe<BodytextOrder>>>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where: InputMaybe<BodytextFilter>;
};


export type QueryDialogArgs = {
  id: Scalars['String']['input'];
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryDialogCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Array<InputMaybe<DialogOrder>>>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where: InputMaybe<DialogFilter>;
};


export type QueryEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Array<InputMaybe<EntryOrder>>>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where: InputMaybe<EntryFilter>;
};


export type QueryNotificationsArgs = {
  id: Scalars['String']['input'];
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryNotificationsCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Array<InputMaybe<NotificationsOrder>>>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where: InputMaybe<NotificationsFilter>;
};


export type QueryPackageArgs = {
  id: Scalars['String']['input'];
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryPackageCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Array<InputMaybe<PackageOrder>>>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where: InputMaybe<PackageFilter>;
};


export type QueryProductArgs = {
  id: Scalars['String']['input'];
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryProductCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Array<InputMaybe<ProductOrder>>>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where: InputMaybe<ProductFilter>;
};


export type QueryResultRowArgs = {
  id: Scalars['String']['input'];
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryResultRowCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  order: InputMaybe<Array<InputMaybe<ResultRowOrder>>>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where: InputMaybe<ResultRowFilter>;
};

export type ResourceLink = {
  sys: ResourceSys;
};

export type ResourceSys = {
  __typename?: 'ResourceSys';
  linkType: Scalars['String']['output'];
  urn: Scalars['String']['output'];
};

/** Result rows [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/resultRow) */
export type ResultRow = Entry & _Node & {
  __typename?: 'ResultRow';
  _id: Scalars['ID']['output'];
  classification: Maybe<Scalars['String']['output']>;
  contentfulMetadata: ContentfulMetadata;
  fact: Maybe<Scalars['String']['output']>;
  highlightedInPackage: Maybe<Scalars['JSON']['output']>;
  linkedFrom: Maybe<ResultRowLinkingCollections>;
  productCode: Maybe<Scalars['String']['output']>;
  result: Maybe<Scalars['Int']['output']>;
  resultImage: Maybe<Asset>;
  resultText: Maybe<Scalars['String']['output']>;
  science: Maybe<Scalars['String']['output']>;
  sys: Sys;
  tip: Maybe<Scalars['String']['output']>;
  tipImage: Maybe<Asset>;
};


/** Result rows [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/resultRow) */
export type ResultRowClassificationArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Result rows [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/resultRow) */
export type ResultRowFactArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Result rows [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/resultRow) */
export type ResultRowHighlightedInPackageArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Result rows [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/resultRow) */
export type ResultRowLinkedFromArgs = {
  allowedLocales: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


/** Result rows [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/resultRow) */
export type ResultRowProductCodeArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Result rows [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/resultRow) */
export type ResultRowResultArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Result rows [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/resultRow) */
export type ResultRowResultImageArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
};


/** Result rows [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/resultRow) */
export type ResultRowResultTextArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Result rows [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/resultRow) */
export type ResultRowScienceArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Result rows [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/resultRow) */
export type ResultRowTipArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
};


/** Result rows [See type definition](https://app.contentful.com/spaces/nslj8lsfnbof/content_types/resultRow) */
export type ResultRowTipImageArgs = {
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
};

export type ResultRowCollection = {
  __typename?: 'ResultRowCollection';
  items: Array<Maybe<ResultRow>>;
  limit: Scalars['Int']['output'];
  skip: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type ResultRowFilter = {
  AND: InputMaybe<Array<InputMaybe<ResultRowFilter>>>;
  OR: InputMaybe<Array<InputMaybe<ResultRowFilter>>>;
  classification: InputMaybe<Scalars['String']['input']>;
  classification_contains: InputMaybe<Scalars['String']['input']>;
  classification_exists: InputMaybe<Scalars['Boolean']['input']>;
  classification_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  classification_not: InputMaybe<Scalars['String']['input']>;
  classification_not_contains: InputMaybe<Scalars['String']['input']>;
  classification_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contentfulMetadata: InputMaybe<ContentfulMetadataFilter>;
  fact: InputMaybe<Scalars['String']['input']>;
  fact_contains: InputMaybe<Scalars['String']['input']>;
  fact_exists: InputMaybe<Scalars['Boolean']['input']>;
  fact_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fact_not: InputMaybe<Scalars['String']['input']>;
  fact_not_contains: InputMaybe<Scalars['String']['input']>;
  fact_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  highlightedInPackage_exists: InputMaybe<Scalars['Boolean']['input']>;
  productCode: InputMaybe<Scalars['String']['input']>;
  productCode_contains: InputMaybe<Scalars['String']['input']>;
  productCode_exists: InputMaybe<Scalars['Boolean']['input']>;
  productCode_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  productCode_not: InputMaybe<Scalars['String']['input']>;
  productCode_not_contains: InputMaybe<Scalars['String']['input']>;
  productCode_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  result: InputMaybe<Scalars['Int']['input']>;
  resultImage_exists: InputMaybe<Scalars['Boolean']['input']>;
  resultText: InputMaybe<Scalars['String']['input']>;
  resultText_contains: InputMaybe<Scalars['String']['input']>;
  resultText_exists: InputMaybe<Scalars['Boolean']['input']>;
  resultText_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  resultText_not: InputMaybe<Scalars['String']['input']>;
  resultText_not_contains: InputMaybe<Scalars['String']['input']>;
  resultText_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  result_exists: InputMaybe<Scalars['Boolean']['input']>;
  result_gt: InputMaybe<Scalars['Int']['input']>;
  result_gte: InputMaybe<Scalars['Int']['input']>;
  result_in: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  result_lt: InputMaybe<Scalars['Int']['input']>;
  result_lte: InputMaybe<Scalars['Int']['input']>;
  result_not: InputMaybe<Scalars['Int']['input']>;
  result_not_in: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  science: InputMaybe<Scalars['String']['input']>;
  science_contains: InputMaybe<Scalars['String']['input']>;
  science_exists: InputMaybe<Scalars['Boolean']['input']>;
  science_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  science_not: InputMaybe<Scalars['String']['input']>;
  science_not_contains: InputMaybe<Scalars['String']['input']>;
  science_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sys: InputMaybe<SysFilter>;
  tip: InputMaybe<Scalars['String']['input']>;
  tipImage_exists: InputMaybe<Scalars['Boolean']['input']>;
  tip_contains: InputMaybe<Scalars['String']['input']>;
  tip_exists: InputMaybe<Scalars['Boolean']['input']>;
  tip_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tip_not: InputMaybe<Scalars['String']['input']>;
  tip_not_contains: InputMaybe<Scalars['String']['input']>;
  tip_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ResultRowLinkingCollections = {
  __typename?: 'ResultRowLinkingCollections';
  entryCollection: Maybe<EntryCollection>;
};


export type ResultRowLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
  preview: InputMaybe<Scalars['Boolean']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export enum ResultRowOrder {
  ClassificationAsc = 'classification_ASC',
  ClassificationDesc = 'classification_DESC',
  ProductCodeAsc = 'productCode_ASC',
  ProductCodeDesc = 'productCode_DESC',
  ResultTextAsc = 'resultText_ASC',
  ResultTextDesc = 'resultText_DESC',
  ResultAsc = 'result_ASC',
  ResultDesc = 'result_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC'
}

export type Sys = {
  __typename?: 'Sys';
  environmentId: Scalars['String']['output'];
  firstPublishedAt: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  /** The locale that was requested. */
  locale: Maybe<Scalars['String']['output']>;
  publishedAt: Maybe<Scalars['DateTime']['output']>;
  publishedVersion: Maybe<Scalars['Int']['output']>;
  spaceId: Scalars['String']['output'];
};

export type SysFilter = {
  firstPublishedAt: InputMaybe<Scalars['DateTime']['input']>;
  firstPublishedAt_exists: InputMaybe<Scalars['Boolean']['input']>;
  firstPublishedAt_gt: InputMaybe<Scalars['DateTime']['input']>;
  firstPublishedAt_gte: InputMaybe<Scalars['DateTime']['input']>;
  firstPublishedAt_in: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  firstPublishedAt_lt: InputMaybe<Scalars['DateTime']['input']>;
  firstPublishedAt_lte: InputMaybe<Scalars['DateTime']['input']>;
  firstPublishedAt_not: InputMaybe<Scalars['DateTime']['input']>;
  firstPublishedAt_not_in: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  id: InputMaybe<Scalars['String']['input']>;
  id_contains: InputMaybe<Scalars['String']['input']>;
  id_exists: InputMaybe<Scalars['Boolean']['input']>;
  id_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not: InputMaybe<Scalars['String']['input']>;
  id_not_contains: InputMaybe<Scalars['String']['input']>;
  id_not_in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  publishedAt: InputMaybe<Scalars['DateTime']['input']>;
  publishedAt_exists: InputMaybe<Scalars['Boolean']['input']>;
  publishedAt_gt: InputMaybe<Scalars['DateTime']['input']>;
  publishedAt_gte: InputMaybe<Scalars['DateTime']['input']>;
  publishedAt_in: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  publishedAt_lt: InputMaybe<Scalars['DateTime']['input']>;
  publishedAt_lte: InputMaybe<Scalars['DateTime']['input']>;
  publishedAt_not: InputMaybe<Scalars['DateTime']['input']>;
  publishedAt_not_in: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  publishedVersion: InputMaybe<Scalars['Float']['input']>;
  publishedVersion_exists: InputMaybe<Scalars['Boolean']['input']>;
  publishedVersion_gt: InputMaybe<Scalars['Float']['input']>;
  publishedVersion_gte: InputMaybe<Scalars['Float']['input']>;
  publishedVersion_in: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  publishedVersion_lt: InputMaybe<Scalars['Float']['input']>;
  publishedVersion_lte: InputMaybe<Scalars['Float']['input']>;
  publishedVersion_not: InputMaybe<Scalars['Float']['input']>;
  publishedVersion_not_in: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
};

/**
 * Represents a taxonomy concept entity for finding and organizing content easily.
 *         Find out more here: https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/content-concepts
 */
export type TaxonomyConcept = {
  __typename?: 'TaxonomyConcept';
  id: Maybe<Scalars['String']['output']>;
};

export type _Node = {
  _id: Scalars['ID']['output'];
};

export type ResultRowFieldsFragment = { __typename?: 'ResultRow', productCode: string | null, tip: string | null, result: number | null, classification: string | null, resultText: string | null, fact: string | null, science: string | null, sys: { __typename?: 'Sys', id: string } };

export type ProductFieldsFragment = { __typename?: 'Product', productCode: number | null, name: string | null, sys: { __typename?: 'Sys', id: string } };

export type GetResultsQueryVariables = Exact<{
  productCodes: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetResultsQuery = { __typename?: 'Query', resultRowCollection: { __typename?: 'ResultRowCollection', total: number, skip: number, limit: number, items: Array<{ __typename?: 'ResultRow', productCode: string | null, tip: string | null, result: number | null, classification: string | null, resultText: string | null, fact: string | null, science: string | null, sys: { __typename?: 'Sys', id: string } } | null> } | null };

export type GetProductsQueryVariables = Exact<{
  productCodes: InputMaybe<Array<Scalars['Int']['input']> | Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetProductsQuery = { __typename?: 'Query', productCollection: { __typename?: 'ProductCollection', total: number, skip: number, limit: number, items: Array<{ __typename?: 'Product', name: string | null, productCode: number | null } | null> } | null };

export const ResultRowFieldsFragmentDoc = gql`
    fragment ResultRowFields on ResultRow {
  sys {
    id
  }
  productCode
  tip
  result
  classification
  resultText
  fact
  science
}
    `;
export const ProductFieldsFragmentDoc = gql`
    fragment ProductFields on Product {
  sys {
    id
  }
  productCode
  name
}
    `;
export const GetResultsDocument = gql`
    query GetResults($productCodes: [String!], $limit: Int = 1000, $skip: Int = 0, $locale: String = "en-US") {
  resultRowCollection(
    where: {productCode_in: $productCodes}
    limit: $limit
    skip: $skip
    locale: $locale
  ) {
    total
    skip
    limit
    items {
      ...ResultRowFields
    }
  }
}
    ${ResultRowFieldsFragmentDoc}`;
export const GetProductsDocument = gql`
    query GetProducts($productCodes: [Int!], $limit: Int = 1000, $skip: Int = 0, $locale: String = "en-US") {
  productCollection(
    where: {productCode_in: $productCodes}
    limit: $limit
    skip: $skip
    locale: $locale
  ) {
    total
    skip
    limit
    items {
      name
      productCode
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    GetResults(variables?: GetResultsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<GetResultsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetResultsQuery>(GetResultsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetResults', 'query', variables);
    },
    GetProducts(variables?: GetProductsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<GetProductsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetProductsQuery>(GetProductsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetProducts', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;