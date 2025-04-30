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
  AWSDate: { input: any; output: any; }
  AWSDateTime: { input: any; output: any; }
  AWSEmail: { input: any; output: any; }
  AWSIPAddress: { input: any; output: any; }
  AWSJSON: { input: any; output: any; }
  AWSPhone: { input: any; output: any; }
  AWSTime: { input: any; output: any; }
  AWSTimestamp: { input: any; output: any; }
  AWSURL: { input: any; output: any; }
};

export type Address = {
  __typename?: 'Address';
  city: Maybe<Scalars['String']['output']>;
  country: Maybe<Scalars['String']['output']>;
  line1: Maybe<Scalars['String']['output']>;
  line2: Maybe<Scalars['String']['output']>;
  notes: Maybe<Scalars['String']['output']>;
  postalCode: Maybe<Scalars['String']['output']>;
  state: Maybe<Scalars['String']['output']>;
};

export type AddressInput = {
  city: InputMaybe<Scalars['String']['input']>;
  country: InputMaybe<Scalars['String']['input']>;
  line1: InputMaybe<Scalars['String']['input']>;
  line2: InputMaybe<Scalars['String']['input']>;
  notes: InputMaybe<Scalars['String']['input']>;
  postalCode: InputMaybe<Scalars['String']['input']>;
  state: InputMaybe<Scalars['String']['input']>;
};

export type Config = {
  __typename?: 'Config';
  createdAt: Scalars['AWSDateTime']['output'];
  data: Maybe<Scalars['AWSJSON']['output']>;
  id: Scalars['String']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
};

export type CreateConfigInput = {
  data: InputMaybe<Scalars['AWSJSON']['input']>;
  id: InputMaybe<Scalars['String']['input']>;
};

export type CreateCustomerInput = {
  address: InputMaybe<AddressInput>;
  compound_dateFirstMainPackageBought_id: InputMaybe<Scalars['String']['input']>;
  customerSampleId: InputMaybe<Scalars['ID']['input']>;
  customerWebadminSampleId: InputMaybe<Scalars['ID']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  firstName: InputMaybe<Scalars['String']['input']>;
  hasBoughtMainPackage: InputMaybe<Scalars['Int']['input']>;
  id: InputMaybe<Scalars['ID']['input']>;
  isSampleReady: InputMaybe<Scalars['Boolean']['input']>;
  languageCode: InputMaybe<Scalars['String']['input']>;
  lastName: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['ID']['input'];
  phoneNumber: Scalars['String']['input'];
  scanSortPrimaryKey: InputMaybe<Scalars['Int']['input']>;
  stripeDevId: InputMaybe<Scalars['String']['input']>;
  stripeId: InputMaybe<Scalars['String']['input']>;
  updatedAt: InputMaybe<Scalars['AWSDateTime']['input']>;
};

export type CreateGiftOrderInput = {
  giftBuyer: GiftBuyerInput;
  id: InputMaybe<Scalars['ID']['input']>;
  orderedPackages: Array<Scalars['Int']['input']>;
  sampleCode: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
};

export type CreateOrderInput = {
  country: Scalars['String']['input'];
  customerOrdersId: InputMaybe<Scalars['ID']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  details: InputMaybe<Scalars['String']['input']>;
  epassi_payment_id: InputMaybe<Scalars['ID']['input']>;
  gfx_code: InputMaybe<Scalars['String']['input']>;
  id: InputMaybe<Scalars['ID']['input']>;
  mobile_pay_payment_id: InputMaybe<Scalars['ID']['input']>;
  owner: InputMaybe<Scalars['ID']['input']>;
  postal_code: InputMaybe<Scalars['String']['input']>;
  stripe_payment_intent_id: InputMaybe<Scalars['String']['input']>;
  user_stripe_id: Scalars['String']['input'];
  wc_order_id: InputMaybe<Scalars['Int']['input']>;
};

export type CreateOrderPackageInput = {
  id: InputMaybe<Scalars['ID']['input']>;
  orderID: Scalars['ID']['input'];
  packageID: Scalars['ID']['input'];
};

export type CreatePackageInput = {
  description: InputMaybe<Scalars['String']['input']>;
  id: InputMaybe<Scalars['ID']['input']>;
  images: InputMaybe<Array<InputMaybe<Scalars['AWSURL']['input']>>>;
  meta_data: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  price: InputMaybe<Scalars['String']['input']>;
  productCode: InputMaybe<Scalars['Int']['input']>;
  productType: InputMaybe<ProductType>;
  short_description: InputMaybe<Scalars['String']['input']>;
  sku: InputMaybe<Scalars['String']['input']>;
  subText: InputMaybe<Scalars['String']['input']>;
  tax_class: InputMaybe<Scalars['String']['input']>;
};

export type CreatePackageProductInput = {
  id: InputMaybe<Scalars['ID']['input']>;
  packageID: Scalars['ID']['input'];
  productID: Scalars['ID']['input'];
};

export type CreatePaymentInput = {
  amount: InputMaybe<Scalars['Int']['input']>;
  ePassiMetadata: InputMaybe<EPassiPaymentMetadataInput>;
  id: InputMaybe<Scalars['ID']['input']>;
  mobilePayMetadata: InputMaybe<MobilePayPaymentMetadataInput>;
  orderId: InputMaybe<Scalars['ID']['input']>;
  packageCodes: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  provider: InputMaybe<PaymentProvider>;
  status: InputMaybe<PaymentStatus>;
  stripeMetadata: InputMaybe<StripePaymentMetadataInput>;
  userId: InputMaybe<Scalars['ID']['input']>;
};

export type CreateProductInput = {
  description: InputMaybe<Scalars['String']['input']>;
  id: InputMaybe<Scalars['ID']['input']>;
  images: InputMaybe<Array<InputMaybe<Scalars['AWSURL']['input']>>>;
  meta_data: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  price: InputMaybe<Scalars['String']['input']>;
  productCode: Scalars['String']['input'];
  productType: InputMaybe<ProductType>;
  short_description: InputMaybe<Scalars['String']['input']>;
  sku: InputMaybe<Scalars['String']['input']>;
  tax_class: InputMaybe<Scalars['String']['input']>;
};

export type CreateReportDataCustomerInput = {
  address: InputMaybe<AddressInput>;
  email: InputMaybe<Scalars['String']['input']>;
  firstName: InputMaybe<Scalars['String']['input']>;
  id: InputMaybe<Scalars['ID']['input']>;
  language: InputMaybe<Scalars['String']['input']>;
  lastName: InputMaybe<Scalars['String']['input']>;
  mobileAppCustomerId: InputMaybe<Scalars['ID']['input']>;
  phoneNumber: InputMaybe<Scalars['String']['input']>;
  resultsReadyDate: InputMaybe<Scalars['String']['input']>;
};

export type CreateReportDataOrderInput = {
  campaign: InputMaybe<Scalars['String']['input']>;
  coupon: InputMaybe<Scalars['String']['input']>;
  details: InputMaybe<Scalars['String']['input']>;
  discount: InputMaybe<Scalars['Float']['input']>;
  id: InputMaybe<Scalars['ID']['input']>;
  orderDate: InputMaybe<Scalars['String']['input']>;
  orderSource: InputMaybe<Scalars['String']['input']>;
  paymentMethod: InputMaybe<Scalars['String']['input']>;
  price: InputMaybe<Scalars['Float']['input']>;
  products: InputMaybe<Array<InputMaybe<ReportDataProductInput>>>;
  reportDataCustomerOrdersId: InputMaybe<Scalars['ID']['input']>;
  reportDataOrderMobileAppOrderIdId: InputMaybe<Scalars['ID']['input']>;
  vatRate: InputMaybe<Scalars['Float']['input']>;
};

export type CreateResultInput = {
  description: InputMaybe<Scalars['String']['input']>;
  id: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  owner: InputMaybe<Scalars['ID']['input']>;
  productResultsId: InputMaybe<Scalars['ID']['input']>;
  sampleResultsId: InputMaybe<Scalars['ID']['input']>;
  value: Scalars['Int']['input'];
};

export type CreateSampleInput = {
  description: InputMaybe<Scalars['String']['input']>;
  id: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  owner: InputMaybe<Scalars['ID']['input']>;
  phoneNumber: Scalars['AWSPhone']['input'];
  sampleCustomerId: InputMaybe<Scalars['ID']['input']>;
  status: InputMaybe<SampleStatus>;
};

export type CreateWebadminSampleInput = {
  batchNumber: InputMaybe<Scalars['Int']['input']>;
  id: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  status: WebadminSampleStatus;
  webadminSampleCustomerId: Scalars['ID']['input'];
};

export type Customer = {
  __typename?: 'Customer';
  address: Maybe<Address>;
  compound_dateFirstMainPackageBought_id: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['AWSDateTime']['output'];
  customerSampleId: Maybe<Scalars['ID']['output']>;
  customerWebadminSampleId: Maybe<Scalars['ID']['output']>;
  description: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  firstName: Maybe<Scalars['String']['output']>;
  hasBoughtMainPackage: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  isSampleReady: Maybe<Scalars['Boolean']['output']>;
  languageCode: Maybe<Scalars['String']['output']>;
  lastName: Maybe<Scalars['String']['output']>;
  orders: Maybe<ModelOrderConnection>;
  owner: Scalars['ID']['output'];
  phoneNumber: Scalars['String']['output'];
  sample: Maybe<Sample>;
  scanSortPrimaryKey: Maybe<Scalars['Int']['output']>;
  stripeDevId: Maybe<Scalars['String']['output']>;
  stripeId: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['AWSDateTime']['output'];
  webadminSample: Maybe<WebadminSample>;
};


export type CustomerOrdersArgs = {
  filter: InputMaybe<ModelOrderFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};

export type DeleteConfigInput = {
  id: Scalars['ID']['input'];
};

export type DeleteCustomerInput = {
  id: Scalars['ID']['input'];
};

export type DeleteGiftOrderInput = {
  id: Scalars['ID']['input'];
};

export type DeleteOrderInput = {
  id: Scalars['ID']['input'];
};

export type DeleteOrderPackageInput = {
  id: Scalars['ID']['input'];
};

export type DeletePackageInput = {
  id: Scalars['ID']['input'];
};

export type DeletePackageProductInput = {
  id: Scalars['ID']['input'];
};

export type DeletePaymentInput = {
  id: Scalars['ID']['input'];
};

export type DeleteProductInput = {
  id: Scalars['ID']['input'];
};

export type DeleteReportDataCustomerInput = {
  id: Scalars['ID']['input'];
};

export type DeleteReportDataOrderInput = {
  id: Scalars['ID']['input'];
};

export type DeleteResultInput = {
  id: Scalars['ID']['input'];
};

export type DeleteSampleInput = {
  id: Scalars['ID']['input'];
};

export type DeleteWebadminSampleInput = {
  id: Scalars['ID']['input'];
};

export type EPassiPaymentMetadata = {
  __typename?: 'EPassiPaymentMetadata';
  paid: Maybe<Scalars['Int']['output']>;
};

export type EPassiPaymentMetadataInput = {
  paid: InputMaybe<Scalars['Int']['input']>;
};

export type GiftBuyer = {
  __typename?: 'GiftBuyer';
  address: Address;
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  phoneNumber: Scalars['String']['output'];
};

export type GiftBuyerInput = {
  address: AddressInput;
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  phoneNumber: Scalars['String']['input'];
};

export type GiftOrder = {
  __typename?: 'GiftOrder';
  createdAt: Scalars['AWSDateTime']['output'];
  giftBuyer: GiftBuyer;
  id: Scalars['ID']['output'];
  orderedPackages: Array<Scalars['Int']['output']>;
  owner: Maybe<Scalars['String']['output']>;
  sampleCode: Maybe<Scalars['String']['output']>;
  status: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['AWSDateTime']['output'];
};

export type MobilePayPaymentMetadata = {
  __typename?: 'MobilePayPaymentMetadata';
  reference: Maybe<Scalars['String']['output']>;
};

export type MobilePayPaymentMetadataInput = {
  reference: InputMaybe<Scalars['String']['input']>;
};

export enum ModelAttributeTypes {
  Null = '_null',
  Binary = 'binary',
  BinarySet = 'binarySet',
  Bool = 'bool',
  List = 'list',
  Map = 'map',
  Number = 'number',
  NumberSet = 'numberSet',
  String = 'string',
  StringSet = 'stringSet'
}

export type ModelBooleanInput = {
  attributeExists: InputMaybe<Scalars['Boolean']['input']>;
  attributeType: InputMaybe<ModelAttributeTypes>;
  eq: InputMaybe<Scalars['Boolean']['input']>;
  ne: InputMaybe<Scalars['Boolean']['input']>;
};

export type ModelConfigConditionInput = {
  and: InputMaybe<Array<InputMaybe<ModelConfigConditionInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  data: InputMaybe<ModelStringInput>;
  id: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelConfigConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelConfigConditionInput>>>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelConfigConnection = {
  __typename?: 'ModelConfigConnection';
  items: Array<Maybe<Config>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelConfigFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelConfigFilterInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  data: InputMaybe<ModelStringInput>;
  id: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelConfigFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelConfigFilterInput>>>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelCustomerConditionInput = {
  and: InputMaybe<Array<InputMaybe<ModelCustomerConditionInput>>>;
  compound_dateFirstMainPackageBought_id: InputMaybe<ModelStringInput>;
  createdAt: InputMaybe<ModelStringInput>;
  customerSampleId: InputMaybe<ModelIdInput>;
  customerWebadminSampleId: InputMaybe<ModelIdInput>;
  description: InputMaybe<ModelStringInput>;
  email: InputMaybe<ModelStringInput>;
  firstName: InputMaybe<ModelStringInput>;
  hasBoughtMainPackage: InputMaybe<ModelIntInput>;
  isSampleReady: InputMaybe<ModelBooleanInput>;
  languageCode: InputMaybe<ModelStringInput>;
  lastName: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelCustomerConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelCustomerConditionInput>>>;
  owner: InputMaybe<ModelIdInput>;
  phoneNumber: InputMaybe<ModelStringInput>;
  scanSortPrimaryKey: InputMaybe<ModelIntInput>;
  stripeDevId: InputMaybe<ModelStringInput>;
  stripeId: InputMaybe<ModelStringInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelCustomerConnection = {
  __typename?: 'ModelCustomerConnection';
  items: Array<Maybe<Customer>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelCustomerFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelCustomerFilterInput>>>;
  compound_dateFirstMainPackageBought_id: InputMaybe<ModelStringInput>;
  createdAt: InputMaybe<ModelStringInput>;
  customerSampleId: InputMaybe<ModelIdInput>;
  customerWebadminSampleId: InputMaybe<ModelIdInput>;
  description: InputMaybe<ModelStringInput>;
  email: InputMaybe<ModelStringInput>;
  firstName: InputMaybe<ModelStringInput>;
  hasBoughtMainPackage: InputMaybe<ModelIntInput>;
  id: InputMaybe<ModelIdInput>;
  isSampleReady: InputMaybe<ModelBooleanInput>;
  languageCode: InputMaybe<ModelStringInput>;
  lastName: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelCustomerFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelCustomerFilterInput>>>;
  owner: InputMaybe<ModelIdInput>;
  phoneNumber: InputMaybe<ModelStringInput>;
  scanSortPrimaryKey: InputMaybe<ModelIntInput>;
  stripeDevId: InputMaybe<ModelStringInput>;
  stripeId: InputMaybe<ModelStringInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelFloatInput = {
  attributeExists: InputMaybe<Scalars['Boolean']['input']>;
  attributeType: InputMaybe<ModelAttributeTypes>;
  between: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  eq: InputMaybe<Scalars['Float']['input']>;
  ge: InputMaybe<Scalars['Float']['input']>;
  gt: InputMaybe<Scalars['Float']['input']>;
  le: InputMaybe<Scalars['Float']['input']>;
  lt: InputMaybe<Scalars['Float']['input']>;
  ne: InputMaybe<Scalars['Float']['input']>;
};

export type ModelGiftOrderConditionInput = {
  and: InputMaybe<Array<InputMaybe<ModelGiftOrderConditionInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelGiftOrderConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelGiftOrderConditionInput>>>;
  orderedPackages: InputMaybe<ModelIntInput>;
  owner: InputMaybe<ModelStringInput>;
  sampleCode: InputMaybe<ModelStringInput>;
  status: InputMaybe<ModelStringInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelGiftOrderConnection = {
  __typename?: 'ModelGiftOrderConnection';
  items: Array<Maybe<GiftOrder>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelGiftOrderFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelGiftOrderFilterInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  id: InputMaybe<ModelIdInput>;
  not: InputMaybe<ModelGiftOrderFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelGiftOrderFilterInput>>>;
  orderedPackages: InputMaybe<ModelIntInput>;
  owner: InputMaybe<ModelStringInput>;
  sampleCode: InputMaybe<ModelStringInput>;
  status: InputMaybe<ModelStringInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelIdInput = {
  attributeExists: InputMaybe<Scalars['Boolean']['input']>;
  attributeType: InputMaybe<ModelAttributeTypes>;
  beginsWith: InputMaybe<Scalars['ID']['input']>;
  between: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  contains: InputMaybe<Scalars['ID']['input']>;
  eq: InputMaybe<Scalars['ID']['input']>;
  ge: InputMaybe<Scalars['ID']['input']>;
  gt: InputMaybe<Scalars['ID']['input']>;
  le: InputMaybe<Scalars['ID']['input']>;
  lt: InputMaybe<Scalars['ID']['input']>;
  ne: InputMaybe<Scalars['ID']['input']>;
  notContains: InputMaybe<Scalars['ID']['input']>;
  size: InputMaybe<ModelSizeInput>;
};

export type ModelIdKeyConditionInput = {
  beginsWith: InputMaybe<Scalars['ID']['input']>;
  between: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  eq: InputMaybe<Scalars['ID']['input']>;
  ge: InputMaybe<Scalars['ID']['input']>;
  gt: InputMaybe<Scalars['ID']['input']>;
  le: InputMaybe<Scalars['ID']['input']>;
  lt: InputMaybe<Scalars['ID']['input']>;
};

export type ModelIntInput = {
  attributeExists: InputMaybe<Scalars['Boolean']['input']>;
  attributeType: InputMaybe<ModelAttributeTypes>;
  between: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  eq: InputMaybe<Scalars['Int']['input']>;
  ge: InputMaybe<Scalars['Int']['input']>;
  gt: InputMaybe<Scalars['Int']['input']>;
  le: InputMaybe<Scalars['Int']['input']>;
  lt: InputMaybe<Scalars['Int']['input']>;
  ne: InputMaybe<Scalars['Int']['input']>;
};

export type ModelOrderConditionInput = {
  and: InputMaybe<Array<InputMaybe<ModelOrderConditionInput>>>;
  country: InputMaybe<ModelStringInput>;
  createdAt: InputMaybe<ModelStringInput>;
  customerOrdersId: InputMaybe<ModelIdInput>;
  description: InputMaybe<ModelStringInput>;
  details: InputMaybe<ModelStringInput>;
  epassi_payment_id: InputMaybe<ModelIdInput>;
  gfx_code: InputMaybe<ModelStringInput>;
  mobile_pay_payment_id: InputMaybe<ModelIdInput>;
  not: InputMaybe<ModelOrderConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelOrderConditionInput>>>;
  owner: InputMaybe<ModelIdInput>;
  postal_code: InputMaybe<ModelStringInput>;
  stripe_payment_intent_id: InputMaybe<ModelStringInput>;
  updatedAt: InputMaybe<ModelStringInput>;
  user_stripe_id: InputMaybe<ModelStringInput>;
  wc_order_id: InputMaybe<ModelIntInput>;
};

export type ModelOrderConnection = {
  __typename?: 'ModelOrderConnection';
  items: Array<Maybe<Order>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelOrderFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelOrderFilterInput>>>;
  country: InputMaybe<ModelStringInput>;
  createdAt: InputMaybe<ModelStringInput>;
  customerOrdersId: InputMaybe<ModelIdInput>;
  description: InputMaybe<ModelStringInput>;
  details: InputMaybe<ModelStringInput>;
  epassi_payment_id: InputMaybe<ModelIdInput>;
  gfx_code: InputMaybe<ModelStringInput>;
  id: InputMaybe<ModelIdInput>;
  mobile_pay_payment_id: InputMaybe<ModelIdInput>;
  not: InputMaybe<ModelOrderFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelOrderFilterInput>>>;
  owner: InputMaybe<ModelIdInput>;
  postal_code: InputMaybe<ModelStringInput>;
  stripe_payment_intent_id: InputMaybe<ModelStringInput>;
  updatedAt: InputMaybe<ModelStringInput>;
  user_stripe_id: InputMaybe<ModelStringInput>;
  wc_order_id: InputMaybe<ModelIntInput>;
};

export type ModelOrderPackageConditionInput = {
  and: InputMaybe<Array<InputMaybe<ModelOrderPackageConditionInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelOrderPackageConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelOrderPackageConditionInput>>>;
  orderID: InputMaybe<ModelIdInput>;
  owner: InputMaybe<ModelStringInput>;
  packageID: InputMaybe<ModelIdInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelOrderPackageConnection = {
  __typename?: 'ModelOrderPackageConnection';
  items: Array<Maybe<OrderPackage>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelOrderPackageFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelOrderPackageFilterInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  id: InputMaybe<ModelIdInput>;
  not: InputMaybe<ModelOrderPackageFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelOrderPackageFilterInput>>>;
  orderID: InputMaybe<ModelIdInput>;
  owner: InputMaybe<ModelStringInput>;
  packageID: InputMaybe<ModelIdInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelPackageConditionInput = {
  and: InputMaybe<Array<InputMaybe<ModelPackageConditionInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  description: InputMaybe<ModelStringInput>;
  images: InputMaybe<ModelStringInput>;
  meta_data: InputMaybe<ModelStringInput>;
  name: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelPackageConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelPackageConditionInput>>>;
  price: InputMaybe<ModelStringInput>;
  productCode: InputMaybe<ModelIntInput>;
  productType: InputMaybe<ModelProductTypeInput>;
  short_description: InputMaybe<ModelStringInput>;
  sku: InputMaybe<ModelStringInput>;
  subText: InputMaybe<ModelStringInput>;
  tax_class: InputMaybe<ModelStringInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelPackageConnection = {
  __typename?: 'ModelPackageConnection';
  items: Array<Maybe<Package>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelPackageFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelPackageFilterInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  description: InputMaybe<ModelStringInput>;
  id: InputMaybe<ModelIdInput>;
  images: InputMaybe<ModelStringInput>;
  meta_data: InputMaybe<ModelStringInput>;
  name: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelPackageFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelPackageFilterInput>>>;
  price: InputMaybe<ModelStringInput>;
  productCode: InputMaybe<ModelIntInput>;
  productType: InputMaybe<ModelProductTypeInput>;
  short_description: InputMaybe<ModelStringInput>;
  sku: InputMaybe<ModelStringInput>;
  subText: InputMaybe<ModelStringInput>;
  tax_class: InputMaybe<ModelStringInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelPackageProductConditionInput = {
  and: InputMaybe<Array<InputMaybe<ModelPackageProductConditionInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelPackageProductConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelPackageProductConditionInput>>>;
  packageID: InputMaybe<ModelIdInput>;
  productID: InputMaybe<ModelIdInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelPackageProductConnection = {
  __typename?: 'ModelPackageProductConnection';
  items: Array<Maybe<PackageProduct>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelPackageProductFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelPackageProductFilterInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  id: InputMaybe<ModelIdInput>;
  not: InputMaybe<ModelPackageProductFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelPackageProductFilterInput>>>;
  packageID: InputMaybe<ModelIdInput>;
  productID: InputMaybe<ModelIdInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelPaymentConditionInput = {
  amount: InputMaybe<ModelIntInput>;
  and: InputMaybe<Array<InputMaybe<ModelPaymentConditionInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelPaymentConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelPaymentConditionInput>>>;
  orderId: InputMaybe<ModelIdInput>;
  packageCodes: InputMaybe<ModelIntInput>;
  provider: InputMaybe<ModelPaymentProviderInput>;
  status: InputMaybe<ModelPaymentStatusInput>;
  updatedAt: InputMaybe<ModelStringInput>;
  userId: InputMaybe<ModelIdInput>;
};

export type ModelPaymentConnection = {
  __typename?: 'ModelPaymentConnection';
  items: Array<Maybe<Payment>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelPaymentFilterInput = {
  amount: InputMaybe<ModelIntInput>;
  and: InputMaybe<Array<InputMaybe<ModelPaymentFilterInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  id: InputMaybe<ModelIdInput>;
  not: InputMaybe<ModelPaymentFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelPaymentFilterInput>>>;
  orderId: InputMaybe<ModelIdInput>;
  packageCodes: InputMaybe<ModelIntInput>;
  provider: InputMaybe<ModelPaymentProviderInput>;
  status: InputMaybe<ModelPaymentStatusInput>;
  updatedAt: InputMaybe<ModelStringInput>;
  userId: InputMaybe<ModelIdInput>;
};

export type ModelPaymentProviderInput = {
  eq: InputMaybe<PaymentProvider>;
  ne: InputMaybe<PaymentProvider>;
};

export type ModelPaymentStatusInput = {
  eq: InputMaybe<PaymentStatus>;
  ne: InputMaybe<PaymentStatus>;
};

export type ModelProductConditionInput = {
  and: InputMaybe<Array<InputMaybe<ModelProductConditionInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  description: InputMaybe<ModelStringInput>;
  images: InputMaybe<ModelStringInput>;
  meta_data: InputMaybe<ModelStringInput>;
  name: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelProductConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelProductConditionInput>>>;
  price: InputMaybe<ModelStringInput>;
  productCode: InputMaybe<ModelStringInput>;
  productType: InputMaybe<ModelProductTypeInput>;
  short_description: InputMaybe<ModelStringInput>;
  sku: InputMaybe<ModelStringInput>;
  tax_class: InputMaybe<ModelStringInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelProductConnection = {
  __typename?: 'ModelProductConnection';
  items: Array<Maybe<Product>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelProductFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelProductFilterInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  description: InputMaybe<ModelStringInput>;
  id: InputMaybe<ModelIdInput>;
  images: InputMaybe<ModelStringInput>;
  meta_data: InputMaybe<ModelStringInput>;
  name: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelProductFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelProductFilterInput>>>;
  price: InputMaybe<ModelStringInput>;
  productCode: InputMaybe<ModelStringInput>;
  productType: InputMaybe<ModelProductTypeInput>;
  short_description: InputMaybe<ModelStringInput>;
  sku: InputMaybe<ModelStringInput>;
  tax_class: InputMaybe<ModelStringInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelProductTypeInput = {
  eq: InputMaybe<ProductType>;
  ne: InputMaybe<ProductType>;
};

export type ModelReportDataCustomerConditionInput = {
  and: InputMaybe<Array<InputMaybe<ModelReportDataCustomerConditionInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  email: InputMaybe<ModelStringInput>;
  firstName: InputMaybe<ModelStringInput>;
  language: InputMaybe<ModelStringInput>;
  lastName: InputMaybe<ModelStringInput>;
  mobileAppCustomerId: InputMaybe<ModelIdInput>;
  not: InputMaybe<ModelReportDataCustomerConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelReportDataCustomerConditionInput>>>;
  phoneNumber: InputMaybe<ModelStringInput>;
  resultsReadyDate: InputMaybe<ModelStringInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelReportDataCustomerConnection = {
  __typename?: 'ModelReportDataCustomerConnection';
  items: Array<Maybe<ReportDataCustomer>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelReportDataCustomerFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelReportDataCustomerFilterInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  email: InputMaybe<ModelStringInput>;
  firstName: InputMaybe<ModelStringInput>;
  id: InputMaybe<ModelIdInput>;
  language: InputMaybe<ModelStringInput>;
  lastName: InputMaybe<ModelStringInput>;
  mobileAppCustomerId: InputMaybe<ModelIdInput>;
  not: InputMaybe<ModelReportDataCustomerFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelReportDataCustomerFilterInput>>>;
  phoneNumber: InputMaybe<ModelStringInput>;
  resultsReadyDate: InputMaybe<ModelStringInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelReportDataOrderConditionInput = {
  and: InputMaybe<Array<InputMaybe<ModelReportDataOrderConditionInput>>>;
  campaign: InputMaybe<ModelStringInput>;
  coupon: InputMaybe<ModelStringInput>;
  createdAt: InputMaybe<ModelStringInput>;
  details: InputMaybe<ModelStringInput>;
  discount: InputMaybe<ModelFloatInput>;
  not: InputMaybe<ModelReportDataOrderConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelReportDataOrderConditionInput>>>;
  orderDate: InputMaybe<ModelStringInput>;
  orderSource: InputMaybe<ModelStringInput>;
  paymentMethod: InputMaybe<ModelStringInput>;
  price: InputMaybe<ModelFloatInput>;
  reportDataCustomerOrdersId: InputMaybe<ModelIdInput>;
  reportDataOrderMobileAppOrderIdId: InputMaybe<ModelIdInput>;
  updatedAt: InputMaybe<ModelStringInput>;
  vatRate: InputMaybe<ModelFloatInput>;
};

export type ModelReportDataOrderConnection = {
  __typename?: 'ModelReportDataOrderConnection';
  items: Array<Maybe<ReportDataOrder>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelReportDataOrderFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelReportDataOrderFilterInput>>>;
  campaign: InputMaybe<ModelStringInput>;
  coupon: InputMaybe<ModelStringInput>;
  createdAt: InputMaybe<ModelStringInput>;
  details: InputMaybe<ModelStringInput>;
  discount: InputMaybe<ModelFloatInput>;
  id: InputMaybe<ModelIdInput>;
  not: InputMaybe<ModelReportDataOrderFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelReportDataOrderFilterInput>>>;
  orderDate: InputMaybe<ModelStringInput>;
  orderSource: InputMaybe<ModelStringInput>;
  paymentMethod: InputMaybe<ModelStringInput>;
  price: InputMaybe<ModelFloatInput>;
  reportDataCustomerOrdersId: InputMaybe<ModelIdInput>;
  reportDataOrderMobileAppOrderIdId: InputMaybe<ModelIdInput>;
  updatedAt: InputMaybe<ModelStringInput>;
  vatRate: InputMaybe<ModelFloatInput>;
};

export type ModelResultConditionInput = {
  and: InputMaybe<Array<InputMaybe<ModelResultConditionInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  description: InputMaybe<ModelStringInput>;
  name: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelResultConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelResultConditionInput>>>;
  owner: InputMaybe<ModelIdInput>;
  productResultsId: InputMaybe<ModelIdInput>;
  sampleResultsId: InputMaybe<ModelIdInput>;
  updatedAt: InputMaybe<ModelStringInput>;
  value: InputMaybe<ModelIntInput>;
};

export type ModelResultConnection = {
  __typename?: 'ModelResultConnection';
  items: Array<Maybe<Result>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelResultFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelResultFilterInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  description: InputMaybe<ModelStringInput>;
  id: InputMaybe<ModelIdInput>;
  name: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelResultFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelResultFilterInput>>>;
  owner: InputMaybe<ModelIdInput>;
  productResultsId: InputMaybe<ModelIdInput>;
  sampleResultsId: InputMaybe<ModelIdInput>;
  updatedAt: InputMaybe<ModelStringInput>;
  value: InputMaybe<ModelIntInput>;
};

export type ModelSampleConditionInput = {
  and: InputMaybe<Array<InputMaybe<ModelSampleConditionInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  description: InputMaybe<ModelStringInput>;
  name: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelSampleConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelSampleConditionInput>>>;
  owner: InputMaybe<ModelIdInput>;
  phoneNumber: InputMaybe<ModelStringInput>;
  sampleCustomerId: InputMaybe<ModelIdInput>;
  status: InputMaybe<ModelSampleStatusInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelSampleConnection = {
  __typename?: 'ModelSampleConnection';
  items: Array<Maybe<Sample>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelSampleFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSampleFilterInput>>>;
  createdAt: InputMaybe<ModelStringInput>;
  description: InputMaybe<ModelStringInput>;
  id: InputMaybe<ModelIdInput>;
  name: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelSampleFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelSampleFilterInput>>>;
  owner: InputMaybe<ModelIdInput>;
  phoneNumber: InputMaybe<ModelStringInput>;
  sampleCustomerId: InputMaybe<ModelIdInput>;
  status: InputMaybe<ModelSampleStatusInput>;
  updatedAt: InputMaybe<ModelStringInput>;
};

export type ModelSampleStatusInput = {
  eq: InputMaybe<SampleStatus>;
  ne: InputMaybe<SampleStatus>;
};

export type ModelSizeInput = {
  between: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  eq: InputMaybe<Scalars['Int']['input']>;
  ge: InputMaybe<Scalars['Int']['input']>;
  gt: InputMaybe<Scalars['Int']['input']>;
  le: InputMaybe<Scalars['Int']['input']>;
  lt: InputMaybe<Scalars['Int']['input']>;
  ne: InputMaybe<Scalars['Int']['input']>;
};

export enum ModelSortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type ModelStringInput = {
  attributeExists: InputMaybe<Scalars['Boolean']['input']>;
  attributeType: InputMaybe<ModelAttributeTypes>;
  beginsWith: InputMaybe<Scalars['String']['input']>;
  between: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contains: InputMaybe<Scalars['String']['input']>;
  eq: InputMaybe<Scalars['String']['input']>;
  ge: InputMaybe<Scalars['String']['input']>;
  gt: InputMaybe<Scalars['String']['input']>;
  le: InputMaybe<Scalars['String']['input']>;
  lt: InputMaybe<Scalars['String']['input']>;
  ne: InputMaybe<Scalars['String']['input']>;
  notContains: InputMaybe<Scalars['String']['input']>;
  size: InputMaybe<ModelSizeInput>;
};

export type ModelStringKeyConditionInput = {
  beginsWith: InputMaybe<Scalars['String']['input']>;
  between: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  eq: InputMaybe<Scalars['String']['input']>;
  ge: InputMaybe<Scalars['String']['input']>;
  gt: InputMaybe<Scalars['String']['input']>;
  le: InputMaybe<Scalars['String']['input']>;
  lt: InputMaybe<Scalars['String']['input']>;
};

export type ModelSubscriptionBooleanInput = {
  eq: InputMaybe<Scalars['Boolean']['input']>;
  ne: InputMaybe<Scalars['Boolean']['input']>;
};

export type ModelSubscriptionConfigFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionConfigFilterInput>>>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  data: InputMaybe<ModelSubscriptionStringInput>;
  id: InputMaybe<ModelSubscriptionStringInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionConfigFilterInput>>>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
};

export type ModelSubscriptionCustomerFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionCustomerFilterInput>>>;
  compound_dateFirstMainPackageBought_id: InputMaybe<ModelSubscriptionStringInput>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  customerOrdersId: InputMaybe<ModelSubscriptionIdInput>;
  customerSampleId: InputMaybe<ModelSubscriptionIdInput>;
  customerWebadminSampleId: InputMaybe<ModelSubscriptionIdInput>;
  description: InputMaybe<ModelSubscriptionStringInput>;
  email: InputMaybe<ModelSubscriptionStringInput>;
  firstName: InputMaybe<ModelSubscriptionStringInput>;
  hasBoughtMainPackage: InputMaybe<ModelSubscriptionIntInput>;
  id: InputMaybe<ModelSubscriptionIdInput>;
  isSampleReady: InputMaybe<ModelSubscriptionBooleanInput>;
  languageCode: InputMaybe<ModelSubscriptionStringInput>;
  lastName: InputMaybe<ModelSubscriptionStringInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionCustomerFilterInput>>>;
  owner: InputMaybe<ModelStringInput>;
  phoneNumber: InputMaybe<ModelSubscriptionStringInput>;
  scanSortPrimaryKey: InputMaybe<ModelSubscriptionIntInput>;
  stripeDevId: InputMaybe<ModelSubscriptionStringInput>;
  stripeId: InputMaybe<ModelSubscriptionStringInput>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
};

export type ModelSubscriptionFloatInput = {
  between: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  eq: InputMaybe<Scalars['Float']['input']>;
  ge: InputMaybe<Scalars['Float']['input']>;
  gt: InputMaybe<Scalars['Float']['input']>;
  in: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  le: InputMaybe<Scalars['Float']['input']>;
  lt: InputMaybe<Scalars['Float']['input']>;
  ne: InputMaybe<Scalars['Float']['input']>;
  notIn: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
};

export type ModelSubscriptionGiftOrderFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionGiftOrderFilterInput>>>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  id: InputMaybe<ModelSubscriptionIdInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionGiftOrderFilterInput>>>;
  orderedPackages: InputMaybe<ModelSubscriptionIntInput>;
  owner: InputMaybe<ModelStringInput>;
  sampleCode: InputMaybe<ModelSubscriptionStringInput>;
  status: InputMaybe<ModelSubscriptionStringInput>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
};

export type ModelSubscriptionIdInput = {
  beginsWith: InputMaybe<Scalars['ID']['input']>;
  between: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  contains: InputMaybe<Scalars['ID']['input']>;
  eq: InputMaybe<Scalars['ID']['input']>;
  ge: InputMaybe<Scalars['ID']['input']>;
  gt: InputMaybe<Scalars['ID']['input']>;
  in: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  le: InputMaybe<Scalars['ID']['input']>;
  lt: InputMaybe<Scalars['ID']['input']>;
  ne: InputMaybe<Scalars['ID']['input']>;
  notContains: InputMaybe<Scalars['ID']['input']>;
  notIn: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

export type ModelSubscriptionIntInput = {
  between: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  eq: InputMaybe<Scalars['Int']['input']>;
  ge: InputMaybe<Scalars['Int']['input']>;
  gt: InputMaybe<Scalars['Int']['input']>;
  in: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  le: InputMaybe<Scalars['Int']['input']>;
  lt: InputMaybe<Scalars['Int']['input']>;
  ne: InputMaybe<Scalars['Int']['input']>;
  notIn: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
};

export type ModelSubscriptionOrderFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionOrderFilterInput>>>;
  country: InputMaybe<ModelSubscriptionStringInput>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  description: InputMaybe<ModelSubscriptionStringInput>;
  details: InputMaybe<ModelSubscriptionStringInput>;
  epassi_payment_id: InputMaybe<ModelSubscriptionIdInput>;
  gfx_code: InputMaybe<ModelSubscriptionStringInput>;
  id: InputMaybe<ModelSubscriptionIdInput>;
  mobile_pay_payment_id: InputMaybe<ModelSubscriptionIdInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionOrderFilterInput>>>;
  owner: InputMaybe<ModelStringInput>;
  postal_code: InputMaybe<ModelSubscriptionStringInput>;
  stripe_payment_intent_id: InputMaybe<ModelSubscriptionStringInput>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
  user_stripe_id: InputMaybe<ModelSubscriptionStringInput>;
  wc_order_id: InputMaybe<ModelSubscriptionIntInput>;
};

export type ModelSubscriptionOrderPackageFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionOrderPackageFilterInput>>>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  id: InputMaybe<ModelSubscriptionIdInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionOrderPackageFilterInput>>>;
  orderID: InputMaybe<ModelSubscriptionIdInput>;
  owner: InputMaybe<ModelStringInput>;
  packageID: InputMaybe<ModelSubscriptionIdInput>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
};

export type ModelSubscriptionPackageFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionPackageFilterInput>>>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  description: InputMaybe<ModelSubscriptionStringInput>;
  id: InputMaybe<ModelSubscriptionIdInput>;
  images: InputMaybe<ModelSubscriptionStringInput>;
  meta_data: InputMaybe<ModelSubscriptionStringInput>;
  name: InputMaybe<ModelSubscriptionStringInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionPackageFilterInput>>>;
  price: InputMaybe<ModelSubscriptionStringInput>;
  productCode: InputMaybe<ModelSubscriptionIntInput>;
  productType: InputMaybe<ModelSubscriptionStringInput>;
  short_description: InputMaybe<ModelSubscriptionStringInput>;
  sku: InputMaybe<ModelSubscriptionStringInput>;
  subText: InputMaybe<ModelSubscriptionStringInput>;
  tax_class: InputMaybe<ModelSubscriptionStringInput>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
};

export type ModelSubscriptionPackageProductFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionPackageProductFilterInput>>>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  id: InputMaybe<ModelSubscriptionIdInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionPackageProductFilterInput>>>;
  packageID: InputMaybe<ModelSubscriptionIdInput>;
  productID: InputMaybe<ModelSubscriptionIdInput>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
};

export type ModelSubscriptionPaymentFilterInput = {
  amount: InputMaybe<ModelSubscriptionIntInput>;
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionPaymentFilterInput>>>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  id: InputMaybe<ModelSubscriptionIdInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionPaymentFilterInput>>>;
  orderId: InputMaybe<ModelSubscriptionIdInput>;
  packageCodes: InputMaybe<ModelSubscriptionIntInput>;
  provider: InputMaybe<ModelSubscriptionStringInput>;
  status: InputMaybe<ModelSubscriptionStringInput>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
  userId: InputMaybe<ModelStringInput>;
};

export type ModelSubscriptionProductFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionProductFilterInput>>>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  description: InputMaybe<ModelSubscriptionStringInput>;
  id: InputMaybe<ModelSubscriptionIdInput>;
  images: InputMaybe<ModelSubscriptionStringInput>;
  meta_data: InputMaybe<ModelSubscriptionStringInput>;
  name: InputMaybe<ModelSubscriptionStringInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionProductFilterInput>>>;
  price: InputMaybe<ModelSubscriptionStringInput>;
  productCode: InputMaybe<ModelSubscriptionStringInput>;
  productResultsId: InputMaybe<ModelSubscriptionIdInput>;
  productType: InputMaybe<ModelSubscriptionStringInput>;
  short_description: InputMaybe<ModelSubscriptionStringInput>;
  sku: InputMaybe<ModelSubscriptionStringInput>;
  tax_class: InputMaybe<ModelSubscriptionStringInput>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
};

export type ModelSubscriptionReportDataCustomerFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionReportDataCustomerFilterInput>>>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  email: InputMaybe<ModelSubscriptionStringInput>;
  firstName: InputMaybe<ModelSubscriptionStringInput>;
  id: InputMaybe<ModelSubscriptionIdInput>;
  language: InputMaybe<ModelSubscriptionStringInput>;
  lastName: InputMaybe<ModelSubscriptionStringInput>;
  mobileAppCustomerId: InputMaybe<ModelSubscriptionIdInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionReportDataCustomerFilterInput>>>;
  phoneNumber: InputMaybe<ModelSubscriptionStringInput>;
  reportDataCustomerOrdersId: InputMaybe<ModelSubscriptionIdInput>;
  resultsReadyDate: InputMaybe<ModelSubscriptionStringInput>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
};

export type ModelSubscriptionReportDataOrderFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionReportDataOrderFilterInput>>>;
  campaign: InputMaybe<ModelSubscriptionStringInput>;
  coupon: InputMaybe<ModelSubscriptionStringInput>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  details: InputMaybe<ModelSubscriptionStringInput>;
  discount: InputMaybe<ModelSubscriptionFloatInput>;
  id: InputMaybe<ModelSubscriptionIdInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionReportDataOrderFilterInput>>>;
  orderDate: InputMaybe<ModelSubscriptionStringInput>;
  orderSource: InputMaybe<ModelSubscriptionStringInput>;
  paymentMethod: InputMaybe<ModelSubscriptionStringInput>;
  price: InputMaybe<ModelSubscriptionFloatInput>;
  reportDataOrderMobileAppOrderIdId: InputMaybe<ModelSubscriptionIdInput>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
  vatRate: InputMaybe<ModelSubscriptionFloatInput>;
};

export type ModelSubscriptionResultFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionResultFilterInput>>>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  description: InputMaybe<ModelSubscriptionStringInput>;
  id: InputMaybe<ModelSubscriptionIdInput>;
  name: InputMaybe<ModelSubscriptionStringInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionResultFilterInput>>>;
  owner: InputMaybe<ModelStringInput>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
  value: InputMaybe<ModelSubscriptionIntInput>;
};

export type ModelSubscriptionSampleFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionSampleFilterInput>>>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  description: InputMaybe<ModelSubscriptionStringInput>;
  id: InputMaybe<ModelSubscriptionIdInput>;
  name: InputMaybe<ModelSubscriptionStringInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionSampleFilterInput>>>;
  owner: InputMaybe<ModelStringInput>;
  phoneNumber: InputMaybe<ModelSubscriptionStringInput>;
  sampleCustomerId: InputMaybe<ModelSubscriptionIdInput>;
  sampleResultsId: InputMaybe<ModelSubscriptionIdInput>;
  status: InputMaybe<ModelSubscriptionStringInput>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
};

export type ModelSubscriptionStringInput = {
  beginsWith: InputMaybe<Scalars['String']['input']>;
  between: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contains: InputMaybe<Scalars['String']['input']>;
  eq: InputMaybe<Scalars['String']['input']>;
  ge: InputMaybe<Scalars['String']['input']>;
  gt: InputMaybe<Scalars['String']['input']>;
  in: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  le: InputMaybe<Scalars['String']['input']>;
  lt: InputMaybe<Scalars['String']['input']>;
  ne: InputMaybe<Scalars['String']['input']>;
  notContains: InputMaybe<Scalars['String']['input']>;
  notIn: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ModelSubscriptionWebadminSampleFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelSubscriptionWebadminSampleFilterInput>>>;
  batchNumber: InputMaybe<ModelSubscriptionIntInput>;
  createdAt: InputMaybe<ModelSubscriptionStringInput>;
  id: InputMaybe<ModelSubscriptionIdInput>;
  name: InputMaybe<ModelSubscriptionStringInput>;
  or: InputMaybe<Array<InputMaybe<ModelSubscriptionWebadminSampleFilterInput>>>;
  status: InputMaybe<ModelSubscriptionStringInput>;
  updatedAt: InputMaybe<ModelSubscriptionStringInput>;
  webadminSampleCustomerId: InputMaybe<ModelStringInput>;
};

export type ModelWebadminSampleConditionInput = {
  and: InputMaybe<Array<InputMaybe<ModelWebadminSampleConditionInput>>>;
  batchNumber: InputMaybe<ModelIntInput>;
  createdAt: InputMaybe<ModelStringInput>;
  name: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelWebadminSampleConditionInput>;
  or: InputMaybe<Array<InputMaybe<ModelWebadminSampleConditionInput>>>;
  status: InputMaybe<ModelWebadminSampleStatusInput>;
  updatedAt: InputMaybe<ModelStringInput>;
  webadminSampleCustomerId: InputMaybe<ModelIdInput>;
};

export type ModelWebadminSampleConnection = {
  __typename?: 'ModelWebadminSampleConnection';
  items: Array<Maybe<WebadminSample>>;
  nextToken: Maybe<Scalars['String']['output']>;
};

export type ModelWebadminSampleFilterInput = {
  and: InputMaybe<Array<InputMaybe<ModelWebadminSampleFilterInput>>>;
  batchNumber: InputMaybe<ModelIntInput>;
  createdAt: InputMaybe<ModelStringInput>;
  id: InputMaybe<ModelIdInput>;
  name: InputMaybe<ModelStringInput>;
  not: InputMaybe<ModelWebadminSampleFilterInput>;
  or: InputMaybe<Array<InputMaybe<ModelWebadminSampleFilterInput>>>;
  status: InputMaybe<ModelWebadminSampleStatusInput>;
  updatedAt: InputMaybe<ModelStringInput>;
  webadminSampleCustomerId: InputMaybe<ModelIdInput>;
};

export type ModelWebadminSampleStatusInput = {
  eq: InputMaybe<WebadminSampleStatus>;
  ne: InputMaybe<WebadminSampleStatus>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createConfig: Maybe<Config>;
  createCustomer: Maybe<Customer>;
  createGiftOrder: Maybe<GiftOrder>;
  createOrder: Maybe<Order>;
  createOrderPackage: Maybe<OrderPackage>;
  createPackage: Maybe<Package>;
  createPackageProduct: Maybe<PackageProduct>;
  createPayment: Maybe<Payment>;
  createProduct: Maybe<Product>;
  createReportDataCustomer: Maybe<ReportDataCustomer>;
  createReportDataOrder: Maybe<ReportDataOrder>;
  createResult: Maybe<Result>;
  createSample: Maybe<Sample>;
  createWebadminSample: Maybe<WebadminSample>;
  deleteConfig: Maybe<Config>;
  deleteCustomer: Maybe<Customer>;
  deleteGiftOrder: Maybe<GiftOrder>;
  deleteOrder: Maybe<Order>;
  deleteOrderPackage: Maybe<OrderPackage>;
  deletePackage: Maybe<Package>;
  deletePackageProduct: Maybe<PackageProduct>;
  deletePayment: Maybe<Payment>;
  deleteProduct: Maybe<Product>;
  deleteReportDataCustomer: Maybe<ReportDataCustomer>;
  deleteReportDataOrder: Maybe<ReportDataOrder>;
  deleteResult: Maybe<Result>;
  deleteSample: Maybe<Sample>;
  deleteWebadminSample: Maybe<WebadminSample>;
  updateConfig: Maybe<Config>;
  updateCustomer: Maybe<Customer>;
  updateGiftOrder: Maybe<GiftOrder>;
  updateOrder: Maybe<Order>;
  updateOrderPackage: Maybe<OrderPackage>;
  updatePackage: Maybe<Package>;
  updatePackageProduct: Maybe<PackageProduct>;
  updatePayment: Maybe<Payment>;
  updateProduct: Maybe<Product>;
  updateReportDataCustomer: Maybe<ReportDataCustomer>;
  updateReportDataOrder: Maybe<ReportDataOrder>;
  updateResult: Maybe<Result>;
  updateSample: Maybe<Sample>;
  updateWebadminSample: Maybe<WebadminSample>;
};


export type MutationCreateConfigArgs = {
  condition: InputMaybe<ModelConfigConditionInput>;
  input: CreateConfigInput;
};


export type MutationCreateCustomerArgs = {
  condition: InputMaybe<ModelCustomerConditionInput>;
  input: CreateCustomerInput;
};


export type MutationCreateGiftOrderArgs = {
  condition: InputMaybe<ModelGiftOrderConditionInput>;
  input: CreateGiftOrderInput;
};


export type MutationCreateOrderArgs = {
  condition: InputMaybe<ModelOrderConditionInput>;
  input: CreateOrderInput;
};


export type MutationCreateOrderPackageArgs = {
  condition: InputMaybe<ModelOrderPackageConditionInput>;
  input: CreateOrderPackageInput;
};


export type MutationCreatePackageArgs = {
  condition: InputMaybe<ModelPackageConditionInput>;
  input: CreatePackageInput;
};


export type MutationCreatePackageProductArgs = {
  condition: InputMaybe<ModelPackageProductConditionInput>;
  input: CreatePackageProductInput;
};


export type MutationCreatePaymentArgs = {
  condition: InputMaybe<ModelPaymentConditionInput>;
  input: CreatePaymentInput;
};


export type MutationCreateProductArgs = {
  condition: InputMaybe<ModelProductConditionInput>;
  input: CreateProductInput;
};


export type MutationCreateReportDataCustomerArgs = {
  condition: InputMaybe<ModelReportDataCustomerConditionInput>;
  input: CreateReportDataCustomerInput;
};


export type MutationCreateReportDataOrderArgs = {
  condition: InputMaybe<ModelReportDataOrderConditionInput>;
  input: CreateReportDataOrderInput;
};


export type MutationCreateResultArgs = {
  condition: InputMaybe<ModelResultConditionInput>;
  input: CreateResultInput;
};


export type MutationCreateSampleArgs = {
  condition: InputMaybe<ModelSampleConditionInput>;
  input: CreateSampleInput;
};


export type MutationCreateWebadminSampleArgs = {
  condition: InputMaybe<ModelWebadminSampleConditionInput>;
  input: CreateWebadminSampleInput;
};


export type MutationDeleteConfigArgs = {
  condition: InputMaybe<ModelConfigConditionInput>;
  input: DeleteConfigInput;
};


export type MutationDeleteCustomerArgs = {
  condition: InputMaybe<ModelCustomerConditionInput>;
  input: DeleteCustomerInput;
};


export type MutationDeleteGiftOrderArgs = {
  condition: InputMaybe<ModelGiftOrderConditionInput>;
  input: DeleteGiftOrderInput;
};


export type MutationDeleteOrderArgs = {
  condition: InputMaybe<ModelOrderConditionInput>;
  input: DeleteOrderInput;
};


export type MutationDeleteOrderPackageArgs = {
  condition: InputMaybe<ModelOrderPackageConditionInput>;
  input: DeleteOrderPackageInput;
};


export type MutationDeletePackageArgs = {
  condition: InputMaybe<ModelPackageConditionInput>;
  input: DeletePackageInput;
};


export type MutationDeletePackageProductArgs = {
  condition: InputMaybe<ModelPackageProductConditionInput>;
  input: DeletePackageProductInput;
};


export type MutationDeletePaymentArgs = {
  condition: InputMaybe<ModelPaymentConditionInput>;
  input: DeletePaymentInput;
};


export type MutationDeleteProductArgs = {
  condition: InputMaybe<ModelProductConditionInput>;
  input: DeleteProductInput;
};


export type MutationDeleteReportDataCustomerArgs = {
  condition: InputMaybe<ModelReportDataCustomerConditionInput>;
  input: DeleteReportDataCustomerInput;
};


export type MutationDeleteReportDataOrderArgs = {
  condition: InputMaybe<ModelReportDataOrderConditionInput>;
  input: DeleteReportDataOrderInput;
};


export type MutationDeleteResultArgs = {
  condition: InputMaybe<ModelResultConditionInput>;
  input: DeleteResultInput;
};


export type MutationDeleteSampleArgs = {
  condition: InputMaybe<ModelSampleConditionInput>;
  input: DeleteSampleInput;
};


export type MutationDeleteWebadminSampleArgs = {
  condition: InputMaybe<ModelWebadminSampleConditionInput>;
  input: DeleteWebadminSampleInput;
};


export type MutationUpdateConfigArgs = {
  condition: InputMaybe<ModelConfigConditionInput>;
  input: UpdateConfigInput;
};


export type MutationUpdateCustomerArgs = {
  condition: InputMaybe<ModelCustomerConditionInput>;
  input: UpdateCustomerInput;
};


export type MutationUpdateGiftOrderArgs = {
  condition: InputMaybe<ModelGiftOrderConditionInput>;
  input: UpdateGiftOrderInput;
};


export type MutationUpdateOrderArgs = {
  condition: InputMaybe<ModelOrderConditionInput>;
  input: UpdateOrderInput;
};


export type MutationUpdateOrderPackageArgs = {
  condition: InputMaybe<ModelOrderPackageConditionInput>;
  input: UpdateOrderPackageInput;
};


export type MutationUpdatePackageArgs = {
  condition: InputMaybe<ModelPackageConditionInput>;
  input: UpdatePackageInput;
};


export type MutationUpdatePackageProductArgs = {
  condition: InputMaybe<ModelPackageProductConditionInput>;
  input: UpdatePackageProductInput;
};


export type MutationUpdatePaymentArgs = {
  condition: InputMaybe<ModelPaymentConditionInput>;
  input: UpdatePaymentInput;
};


export type MutationUpdateProductArgs = {
  condition: InputMaybe<ModelProductConditionInput>;
  input: UpdateProductInput;
};


export type MutationUpdateReportDataCustomerArgs = {
  condition: InputMaybe<ModelReportDataCustomerConditionInput>;
  input: UpdateReportDataCustomerInput;
};


export type MutationUpdateReportDataOrderArgs = {
  condition: InputMaybe<ModelReportDataOrderConditionInput>;
  input: UpdateReportDataOrderInput;
};


export type MutationUpdateResultArgs = {
  condition: InputMaybe<ModelResultConditionInput>;
  input: UpdateResultInput;
};


export type MutationUpdateSampleArgs = {
  condition: InputMaybe<ModelSampleConditionInput>;
  input: UpdateSampleInput;
};


export type MutationUpdateWebadminSampleArgs = {
  condition: InputMaybe<ModelWebadminSampleConditionInput>;
  input: UpdateWebadminSampleInput;
};

export type Order = {
  __typename?: 'Order';
  country: Scalars['String']['output'];
  createdAt: Scalars['AWSDateTime']['output'];
  customer: Maybe<Customer>;
  customerOrdersId: Maybe<Scalars['ID']['output']>;
  description: Maybe<Scalars['String']['output']>;
  details: Maybe<Scalars['String']['output']>;
  epassi_payment_id: Maybe<Scalars['ID']['output']>;
  gfx_code: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  mobile_pay_payment_id: Maybe<Scalars['ID']['output']>;
  owner: Maybe<Scalars['ID']['output']>;
  packages: Maybe<ModelOrderPackageConnection>;
  postal_code: Maybe<Scalars['String']['output']>;
  stripe_payment_intent_id: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['AWSDateTime']['output'];
  user_stripe_id: Scalars['String']['output'];
  wc_order_id: Maybe<Scalars['Int']['output']>;
};


export type OrderPackagesArgs = {
  filter: InputMaybe<ModelOrderPackageFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};

export type OrderPackage = {
  __typename?: 'OrderPackage';
  createdAt: Scalars['AWSDateTime']['output'];
  id: Scalars['ID']['output'];
  order: Order;
  orderID: Scalars['ID']['output'];
  owner: Maybe<Scalars['String']['output']>;
  package: Package;
  packageID: Scalars['ID']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
};

export type Package = {
  __typename?: 'Package';
  createdAt: Scalars['AWSDateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  images: Maybe<Array<Maybe<Scalars['AWSURL']['output']>>>;
  meta_data: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  orders: Maybe<ModelOrderPackageConnection>;
  price: Maybe<Scalars['String']['output']>;
  productCode: Maybe<Scalars['Int']['output']>;
  productType: Maybe<ProductType>;
  products: Maybe<ModelPackageProductConnection>;
  short_description: Maybe<Scalars['String']['output']>;
  sku: Maybe<Scalars['String']['output']>;
  subText: Maybe<Scalars['String']['output']>;
  tax_class: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['AWSDateTime']['output'];
};


export type PackageOrdersArgs = {
  filter: InputMaybe<ModelOrderPackageFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type PackageProductsArgs = {
  filter: InputMaybe<ModelPackageProductFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};

export type PackageProduct = {
  __typename?: 'PackageProduct';
  createdAt: Scalars['AWSDateTime']['output'];
  id: Scalars['ID']['output'];
  package: Package;
  packageID: Scalars['ID']['output'];
  product: Product;
  productID: Scalars['ID']['output'];
  updatedAt: Scalars['AWSDateTime']['output'];
};

export type Payment = {
  __typename?: 'Payment';
  amount: Maybe<Scalars['Int']['output']>;
  createdAt: Scalars['AWSDateTime']['output'];
  ePassiMetadata: Maybe<EPassiPaymentMetadata>;
  id: Scalars['ID']['output'];
  mobilePayMetadata: Maybe<MobilePayPaymentMetadata>;
  orderId: Maybe<Scalars['ID']['output']>;
  packageCodes: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  provider: Maybe<PaymentProvider>;
  status: Maybe<PaymentStatus>;
  stripeMetadata: Maybe<StripePaymentMetadata>;
  updatedAt: Scalars['AWSDateTime']['output'];
  userId: Maybe<Scalars['ID']['output']>;
};

export enum PaymentProvider {
  Epassi = 'EPASSI',
  MobilePay = 'MOBILE_PAY'
}

export enum PaymentStatus {
  Completed = 'COMPLETED',
  Created = 'CREATED'
}

export type Product = {
  __typename?: 'Product';
  createdAt: Scalars['AWSDateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  images: Maybe<Array<Maybe<Scalars['AWSURL']['output']>>>;
  meta_data: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  packages: Maybe<ModelPackageProductConnection>;
  price: Maybe<Scalars['String']['output']>;
  productCode: Scalars['String']['output'];
  productType: Maybe<ProductType>;
  results: Maybe<ModelResultConnection>;
  short_description: Maybe<Scalars['String']['output']>;
  sku: Maybe<Scalars['String']['output']>;
  tax_class: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['AWSDateTime']['output'];
};


export type ProductPackagesArgs = {
  filter: InputMaybe<ModelPackageProductFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type ProductResultsArgs = {
  filter: InputMaybe<ModelResultFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};

export enum ProductType {
  Bundle = 'BUNDLE',
  Extra = 'EXTRA',
  Main = 'MAIN',
  Plus = 'PLUS'
}

export type Query = {
  __typename?: 'Query';
  RDCustomerByMobAppCustomerId: Maybe<ModelReportDataCustomerConnection>;
  customerByHasBoughtMainPackage: Maybe<ModelCustomerConnection>;
  customerByPhoneNumber: Maybe<ModelCustomerConnection>;
  customerScanByUpdatedAt: Maybe<ModelCustomerConnection>;
  getConfig: Maybe<Config>;
  getCustomer: Maybe<Customer>;
  getCustomerByCognitoSub: Maybe<ModelCustomerConnection>;
  getCustomerByStripeId: Maybe<ModelCustomerConnection>;
  getGiftOrder: Maybe<GiftOrder>;
  getOrder: Maybe<Order>;
  getOrderPackage: Maybe<OrderPackage>;
  getPackage: Maybe<Package>;
  getPackageProduct: Maybe<PackageProduct>;
  getPayment: Maybe<Payment>;
  getProduct: Maybe<Product>;
  getProductByCode: Maybe<ModelProductConnection>;
  getReportDataCustomer: Maybe<ReportDataCustomer>;
  getReportDataOrder: Maybe<ReportDataOrder>;
  getResult: Maybe<Result>;
  getSample: Maybe<Sample>;
  getSampleByName: Maybe<ModelSampleConnection>;
  getWebadminSample: Maybe<WebadminSample>;
  listConfigs: Maybe<ModelConfigConnection>;
  listCustomers: Maybe<ModelCustomerConnection>;
  listGiftOrders: Maybe<ModelGiftOrderConnection>;
  listOrderPackages: Maybe<ModelOrderPackageConnection>;
  listOrders: Maybe<ModelOrderConnection>;
  listPackageProducts: Maybe<ModelPackageProductConnection>;
  listPackages: Maybe<ModelPackageConnection>;
  listPayments: Maybe<ModelPaymentConnection>;
  listProducts: Maybe<ModelProductConnection>;
  listReportDataCustomers: Maybe<ModelReportDataCustomerConnection>;
  listReportDataOrders: Maybe<ModelReportDataOrderConnection>;
  listResults: Maybe<ModelResultConnection>;
  listSamples: Maybe<ModelSampleConnection>;
  listWebadminSamples: Maybe<ModelWebadminSampleConnection>;
  orderByEPassiPayPaymentId: Maybe<ModelOrderConnection>;
  orderByMobilePayPaymentId: Maybe<ModelOrderConnection>;
  orderByOwner: Maybe<ModelOrderConnection>;
  orderByStripePaymentIntentId: Maybe<ModelOrderConnection>;
  packageByCode: Maybe<ModelPackageConnection>;
  resultByOwner: Maybe<ModelResultConnection>;
  sampleByCustomer: Maybe<ModelSampleConnection>;
  webadminSampleByCustomer: Maybe<ModelWebadminSampleConnection>;
};


export type QueryRdCustomerByMobAppCustomerIdArgs = {
  filter: InputMaybe<ModelReportDataCustomerFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  mobileAppCustomerId: Scalars['ID']['input'];
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type QueryCustomerByHasBoughtMainPackageArgs = {
  compound_dateFirstMainPackageBought_id: InputMaybe<ModelStringKeyConditionInput>;
  filter: InputMaybe<ModelCustomerFilterInput>;
  hasBoughtMainPackage: Scalars['Int']['input'];
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type QueryCustomerByPhoneNumberArgs = {
  filter: InputMaybe<ModelCustomerFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  phoneNumber: Scalars['String']['input'];
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type QueryCustomerScanByUpdatedAtArgs = {
  filter: InputMaybe<ModelCustomerFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  scanSortPrimaryKey: Scalars['Int']['input'];
  sortDirection: InputMaybe<ModelSortDirection>;
  updatedAt: InputMaybe<ModelStringKeyConditionInput>;
};


export type QueryGetConfigArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetCustomerArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetCustomerByCognitoSubArgs = {
  filter: InputMaybe<ModelCustomerFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['ID']['input'];
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type QueryGetCustomerByStripeIdArgs = {
  filter: InputMaybe<ModelCustomerFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
  stripeId: Scalars['String']['input'];
};


export type QueryGetGiftOrderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetOrderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetOrderPackageArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPackageArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPackageProductArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPaymentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetProductArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetProductByCodeArgs = {
  filter: InputMaybe<ModelProductFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  productCode: Scalars['String']['input'];
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type QueryGetReportDataCustomerArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetReportDataOrderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetResultArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetSampleArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetSampleByNameArgs = {
  filter: InputMaybe<ModelSampleFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type QueryGetWebadminSampleArgs = {
  id: Scalars['ID']['input'];
};


export type QueryListConfigsArgs = {
  filter: InputMaybe<ModelConfigFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
};


export type QueryListCustomersArgs = {
  filter: InputMaybe<ModelCustomerFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
};


export type QueryListGiftOrdersArgs = {
  filter: InputMaybe<ModelGiftOrderFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
};


export type QueryListOrderPackagesArgs = {
  filter: InputMaybe<ModelOrderPackageFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
};


export type QueryListOrdersArgs = {
  filter: InputMaybe<ModelOrderFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
};


export type QueryListPackageProductsArgs = {
  filter: InputMaybe<ModelPackageProductFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
};


export type QueryListPackagesArgs = {
  filter: InputMaybe<ModelPackageFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
};


export type QueryListPaymentsArgs = {
  filter: InputMaybe<ModelPaymentFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
};


export type QueryListProductsArgs = {
  filter: InputMaybe<ModelProductFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
};


export type QueryListReportDataCustomersArgs = {
  filter: InputMaybe<ModelReportDataCustomerFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
};


export type QueryListReportDataOrdersArgs = {
  filter: InputMaybe<ModelReportDataOrderFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
};


export type QueryListResultsArgs = {
  filter: InputMaybe<ModelResultFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
};


export type QueryListSamplesArgs = {
  filter: InputMaybe<ModelSampleFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
};


export type QueryListWebadminSamplesArgs = {
  filter: InputMaybe<ModelWebadminSampleFilterInput>;
  id: InputMaybe<Scalars['ID']['input']>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type QueryOrderByEPassiPayPaymentIdArgs = {
  epassi_payment_id: Scalars['ID']['input'];
  filter: InputMaybe<ModelOrderFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type QueryOrderByMobilePayPaymentIdArgs = {
  filter: InputMaybe<ModelOrderFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  mobile_pay_payment_id: Scalars['ID']['input'];
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type QueryOrderByOwnerArgs = {
  filter: InputMaybe<ModelOrderFilterInput>;
  id: InputMaybe<ModelIdKeyConditionInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['ID']['input'];
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type QueryOrderByStripePaymentIntentIdArgs = {
  filter: InputMaybe<ModelOrderFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
  stripe_payment_intent_id: Scalars['String']['input'];
};


export type QueryPackageByCodeArgs = {
  filter: InputMaybe<ModelPackageFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  productCode: Scalars['Int']['input'];
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type QueryResultByOwnerArgs = {
  filter: InputMaybe<ModelResultFilterInput>;
  id: InputMaybe<ModelIdKeyConditionInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  owner: Scalars['ID']['input'];
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type QuerySampleByCustomerArgs = {
  filter: InputMaybe<ModelSampleFilterInput>;
  id: InputMaybe<ModelIdKeyConditionInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sampleCustomerId: Scalars['ID']['input'];
  sortDirection: InputMaybe<ModelSortDirection>;
};


export type QueryWebadminSampleByCustomerArgs = {
  filter: InputMaybe<ModelWebadminSampleFilterInput>;
  id: InputMaybe<ModelIdKeyConditionInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
  webadminSampleCustomerId: Scalars['ID']['input'];
};

export type ReportDataCustomer = {
  __typename?: 'ReportDataCustomer';
  address: Maybe<Address>;
  createdAt: Scalars['AWSDateTime']['output'];
  customer: Maybe<Customer>;
  email: Maybe<Scalars['String']['output']>;
  firstName: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  language: Maybe<Scalars['String']['output']>;
  lastName: Maybe<Scalars['String']['output']>;
  mobileAppCustomerId: Maybe<Scalars['ID']['output']>;
  orders: Maybe<ModelReportDataOrderConnection>;
  phoneNumber: Maybe<Scalars['String']['output']>;
  resultsReadyDate: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['AWSDateTime']['output'];
};


export type ReportDataCustomerOrdersArgs = {
  filter: InputMaybe<ModelReportDataOrderFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};

export type ReportDataOrder = {
  __typename?: 'ReportDataOrder';
  campaign: Maybe<Scalars['String']['output']>;
  coupon: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['AWSDateTime']['output'];
  customer: Maybe<ReportDataCustomer>;
  details: Maybe<Scalars['String']['output']>;
  discount: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  mobileAppOrderId: Maybe<Order>;
  orderDate: Maybe<Scalars['String']['output']>;
  orderSource: Maybe<Scalars['String']['output']>;
  paymentMethod: Maybe<Scalars['String']['output']>;
  price: Maybe<Scalars['Float']['output']>;
  products: Maybe<Array<Maybe<ReportDataProduct>>>;
  reportDataCustomerOrdersId: Maybe<Scalars['ID']['output']>;
  reportDataOrderMobileAppOrderIdId: Maybe<Scalars['ID']['output']>;
  updatedAt: Scalars['AWSDateTime']['output'];
  vatRate: Maybe<Scalars['Float']['output']>;
};

export type ReportDataProduct = {
  __typename?: 'ReportDataProduct';
  name: Maybe<Scalars['String']['output']>;
  price: Maybe<Scalars['Float']['output']>;
};

export type ReportDataProductInput = {
  name: InputMaybe<Scalars['String']['input']>;
  price: InputMaybe<Scalars['Float']['input']>;
};

export type Result = {
  __typename?: 'Result';
  createdAt: Scalars['AWSDateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  owner: Maybe<Scalars['ID']['output']>;
  productResultsId: Maybe<Scalars['ID']['output']>;
  sampleResultsId: Maybe<Scalars['ID']['output']>;
  updatedAt: Scalars['AWSDateTime']['output'];
  value: Scalars['Int']['output'];
};

export type Sample = {
  __typename?: 'Sample';
  createdAt: Scalars['AWSDateTime']['output'];
  customer: Maybe<Customer>;
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  owner: Maybe<Scalars['ID']['output']>;
  phoneNumber: Scalars['AWSPhone']['output'];
  results: Maybe<ModelResultConnection>;
  sampleCustomerId: Maybe<Scalars['ID']['output']>;
  status: Maybe<SampleStatus>;
  updatedAt: Scalars['AWSDateTime']['output'];
};


export type SampleResultsArgs = {
  filter: InputMaybe<ModelResultFilterInput>;
  limit: InputMaybe<Scalars['Int']['input']>;
  nextToken: InputMaybe<Scalars['String']['input']>;
  sortDirection: InputMaybe<ModelSortDirection>;
};

export enum SampleStatus {
  InGenotyping = 'IN_GENOTYPING',
  Ready = 'READY',
  Received = 'RECEIVED',
  Sent = 'SENT'
}

export type StripePaymentMetadata = {
  __typename?: 'StripePaymentMetadata';
  paymentIntentId: Maybe<Scalars['String']['output']>;
};

export type StripePaymentMetadataInput = {
  paymentIntentId: InputMaybe<Scalars['String']['input']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  onCreateConfig: Maybe<Config>;
  onCreateCustomer: Maybe<Customer>;
  onCreateGiftOrder: Maybe<GiftOrder>;
  onCreateOrder: Maybe<Order>;
  onCreateOrderPackage: Maybe<OrderPackage>;
  onCreatePackage: Maybe<Package>;
  onCreatePackageProduct: Maybe<PackageProduct>;
  onCreatePayment: Maybe<Payment>;
  onCreateProduct: Maybe<Product>;
  onCreateReportDataCustomer: Maybe<ReportDataCustomer>;
  onCreateReportDataOrder: Maybe<ReportDataOrder>;
  onCreateResult: Maybe<Result>;
  onCreateSample: Maybe<Sample>;
  onCreateWebadminSample: Maybe<WebadminSample>;
  onDeleteConfig: Maybe<Config>;
  onDeleteCustomer: Maybe<Customer>;
  onDeleteGiftOrder: Maybe<GiftOrder>;
  onDeleteOrder: Maybe<Order>;
  onDeleteOrderPackage: Maybe<OrderPackage>;
  onDeletePackage: Maybe<Package>;
  onDeletePackageProduct: Maybe<PackageProduct>;
  onDeletePayment: Maybe<Payment>;
  onDeleteProduct: Maybe<Product>;
  onDeleteReportDataCustomer: Maybe<ReportDataCustomer>;
  onDeleteReportDataOrder: Maybe<ReportDataOrder>;
  onDeleteResult: Maybe<Result>;
  onDeleteSample: Maybe<Sample>;
  onDeleteWebadminSample: Maybe<WebadminSample>;
  onUpdateConfig: Maybe<Config>;
  onUpdateCustomer: Maybe<Customer>;
  onUpdateGiftOrder: Maybe<GiftOrder>;
  onUpdateOrder: Maybe<Order>;
  onUpdateOrderPackage: Maybe<OrderPackage>;
  onUpdatePackage: Maybe<Package>;
  onUpdatePackageProduct: Maybe<PackageProduct>;
  onUpdatePayment: Maybe<Payment>;
  onUpdateProduct: Maybe<Product>;
  onUpdateReportDataCustomer: Maybe<ReportDataCustomer>;
  onUpdateReportDataOrder: Maybe<ReportDataOrder>;
  onUpdateResult: Maybe<Result>;
  onUpdateSample: Maybe<Sample>;
  onUpdateWebadminSample: Maybe<WebadminSample>;
};


export type SubscriptionOnCreateConfigArgs = {
  filter: InputMaybe<ModelSubscriptionConfigFilterInput>;
};


export type SubscriptionOnCreateCustomerArgs = {
  filter: InputMaybe<ModelSubscriptionCustomerFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnCreateGiftOrderArgs = {
  filter: InputMaybe<ModelSubscriptionGiftOrderFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnCreateOrderArgs = {
  filter: InputMaybe<ModelSubscriptionOrderFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnCreateOrderPackageArgs = {
  filter: InputMaybe<ModelSubscriptionOrderPackageFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnCreatePackageArgs = {
  filter: InputMaybe<ModelSubscriptionPackageFilterInput>;
};


export type SubscriptionOnCreatePackageProductArgs = {
  filter: InputMaybe<ModelSubscriptionPackageProductFilterInput>;
};


export type SubscriptionOnCreatePaymentArgs = {
  filter: InputMaybe<ModelSubscriptionPaymentFilterInput>;
  userId: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnCreateProductArgs = {
  filter: InputMaybe<ModelSubscriptionProductFilterInput>;
};


export type SubscriptionOnCreateReportDataCustomerArgs = {
  filter: InputMaybe<ModelSubscriptionReportDataCustomerFilterInput>;
};


export type SubscriptionOnCreateReportDataOrderArgs = {
  filter: InputMaybe<ModelSubscriptionReportDataOrderFilterInput>;
};


export type SubscriptionOnCreateResultArgs = {
  filter: InputMaybe<ModelSubscriptionResultFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnCreateSampleArgs = {
  filter: InputMaybe<ModelSubscriptionSampleFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnCreateWebadminSampleArgs = {
  filter: InputMaybe<ModelSubscriptionWebadminSampleFilterInput>;
  webadminSampleCustomerId: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnDeleteConfigArgs = {
  filter: InputMaybe<ModelSubscriptionConfigFilterInput>;
};


export type SubscriptionOnDeleteCustomerArgs = {
  filter: InputMaybe<ModelSubscriptionCustomerFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnDeleteGiftOrderArgs = {
  filter: InputMaybe<ModelSubscriptionGiftOrderFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnDeleteOrderArgs = {
  filter: InputMaybe<ModelSubscriptionOrderFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnDeleteOrderPackageArgs = {
  filter: InputMaybe<ModelSubscriptionOrderPackageFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnDeletePackageArgs = {
  filter: InputMaybe<ModelSubscriptionPackageFilterInput>;
};


export type SubscriptionOnDeletePackageProductArgs = {
  filter: InputMaybe<ModelSubscriptionPackageProductFilterInput>;
};


export type SubscriptionOnDeletePaymentArgs = {
  filter: InputMaybe<ModelSubscriptionPaymentFilterInput>;
  userId: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnDeleteProductArgs = {
  filter: InputMaybe<ModelSubscriptionProductFilterInput>;
};


export type SubscriptionOnDeleteReportDataCustomerArgs = {
  filter: InputMaybe<ModelSubscriptionReportDataCustomerFilterInput>;
};


export type SubscriptionOnDeleteReportDataOrderArgs = {
  filter: InputMaybe<ModelSubscriptionReportDataOrderFilterInput>;
};


export type SubscriptionOnDeleteResultArgs = {
  filter: InputMaybe<ModelSubscriptionResultFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnDeleteSampleArgs = {
  filter: InputMaybe<ModelSubscriptionSampleFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnDeleteWebadminSampleArgs = {
  filter: InputMaybe<ModelSubscriptionWebadminSampleFilterInput>;
  webadminSampleCustomerId: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnUpdateConfigArgs = {
  filter: InputMaybe<ModelSubscriptionConfigFilterInput>;
};


export type SubscriptionOnUpdateCustomerArgs = {
  filter: InputMaybe<ModelSubscriptionCustomerFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnUpdateGiftOrderArgs = {
  filter: InputMaybe<ModelSubscriptionGiftOrderFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnUpdateOrderArgs = {
  filter: InputMaybe<ModelSubscriptionOrderFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnUpdateOrderPackageArgs = {
  filter: InputMaybe<ModelSubscriptionOrderPackageFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnUpdatePackageArgs = {
  filter: InputMaybe<ModelSubscriptionPackageFilterInput>;
};


export type SubscriptionOnUpdatePackageProductArgs = {
  filter: InputMaybe<ModelSubscriptionPackageProductFilterInput>;
};


export type SubscriptionOnUpdatePaymentArgs = {
  filter: InputMaybe<ModelSubscriptionPaymentFilterInput>;
  userId: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnUpdateProductArgs = {
  filter: InputMaybe<ModelSubscriptionProductFilterInput>;
};


export type SubscriptionOnUpdateReportDataCustomerArgs = {
  filter: InputMaybe<ModelSubscriptionReportDataCustomerFilterInput>;
};


export type SubscriptionOnUpdateReportDataOrderArgs = {
  filter: InputMaybe<ModelSubscriptionReportDataOrderFilterInput>;
};


export type SubscriptionOnUpdateResultArgs = {
  filter: InputMaybe<ModelSubscriptionResultFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnUpdateSampleArgs = {
  filter: InputMaybe<ModelSubscriptionSampleFilterInput>;
  owner: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionOnUpdateWebadminSampleArgs = {
  filter: InputMaybe<ModelSubscriptionWebadminSampleFilterInput>;
  webadminSampleCustomerId: InputMaybe<Scalars['String']['input']>;
};

export type UpdateConfigInput = {
  data: InputMaybe<Scalars['AWSJSON']['input']>;
  id: Scalars['String']['input'];
};

export type UpdateCustomerInput = {
  address: InputMaybe<AddressInput>;
  compound_dateFirstMainPackageBought_id: InputMaybe<Scalars['String']['input']>;
  customerSampleId: InputMaybe<Scalars['ID']['input']>;
  customerWebadminSampleId: InputMaybe<Scalars['ID']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  email: InputMaybe<Scalars['String']['input']>;
  firstName: InputMaybe<Scalars['String']['input']>;
  hasBoughtMainPackage: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['ID']['input'];
  isSampleReady: InputMaybe<Scalars['Boolean']['input']>;
  languageCode: InputMaybe<Scalars['String']['input']>;
  lastName: InputMaybe<Scalars['String']['input']>;
  owner: InputMaybe<Scalars['ID']['input']>;
  phoneNumber: InputMaybe<Scalars['String']['input']>;
  scanSortPrimaryKey: InputMaybe<Scalars['Int']['input']>;
  stripeDevId: InputMaybe<Scalars['String']['input']>;
  stripeId: InputMaybe<Scalars['String']['input']>;
  updatedAt: InputMaybe<Scalars['AWSDateTime']['input']>;
};

export type UpdateGiftOrderInput = {
  giftBuyer: InputMaybe<GiftBuyerInput>;
  id: Scalars['ID']['input'];
  orderedPackages: InputMaybe<Array<Scalars['Int']['input']>>;
  sampleCode: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<Scalars['String']['input']>;
};

export type UpdateOrderInput = {
  country: InputMaybe<Scalars['String']['input']>;
  customerOrdersId: InputMaybe<Scalars['ID']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  details: InputMaybe<Scalars['String']['input']>;
  epassi_payment_id: InputMaybe<Scalars['ID']['input']>;
  gfx_code: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  mobile_pay_payment_id: InputMaybe<Scalars['ID']['input']>;
  owner: InputMaybe<Scalars['ID']['input']>;
  postal_code: InputMaybe<Scalars['String']['input']>;
  stripe_payment_intent_id: InputMaybe<Scalars['String']['input']>;
  user_stripe_id: InputMaybe<Scalars['String']['input']>;
  wc_order_id: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateOrderPackageInput = {
  id: Scalars['ID']['input'];
  orderID: InputMaybe<Scalars['ID']['input']>;
  packageID: InputMaybe<Scalars['ID']['input']>;
};

export type UpdatePackageInput = {
  description: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  images: InputMaybe<Array<InputMaybe<Scalars['AWSURL']['input']>>>;
  meta_data: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  price: InputMaybe<Scalars['String']['input']>;
  productCode: InputMaybe<Scalars['Int']['input']>;
  productType: InputMaybe<ProductType>;
  short_description: InputMaybe<Scalars['String']['input']>;
  sku: InputMaybe<Scalars['String']['input']>;
  subText: InputMaybe<Scalars['String']['input']>;
  tax_class: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePackageProductInput = {
  id: Scalars['ID']['input'];
  packageID: InputMaybe<Scalars['ID']['input']>;
  productID: InputMaybe<Scalars['ID']['input']>;
};

export type UpdatePaymentInput = {
  amount: InputMaybe<Scalars['Int']['input']>;
  ePassiMetadata: InputMaybe<EPassiPaymentMetadataInput>;
  id: Scalars['ID']['input'];
  mobilePayMetadata: InputMaybe<MobilePayPaymentMetadataInput>;
  orderId: InputMaybe<Scalars['ID']['input']>;
  packageCodes: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  provider: InputMaybe<PaymentProvider>;
  status: InputMaybe<PaymentStatus>;
  stripeMetadata: InputMaybe<StripePaymentMetadataInput>;
  userId: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateProductInput = {
  description: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  images: InputMaybe<Array<InputMaybe<Scalars['AWSURL']['input']>>>;
  meta_data: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  price: InputMaybe<Scalars['String']['input']>;
  productCode: InputMaybe<Scalars['String']['input']>;
  productType: InputMaybe<ProductType>;
  short_description: InputMaybe<Scalars['String']['input']>;
  sku: InputMaybe<Scalars['String']['input']>;
  tax_class: InputMaybe<Scalars['String']['input']>;
};

export type UpdateReportDataCustomerInput = {
  address: InputMaybe<AddressInput>;
  email: InputMaybe<Scalars['String']['input']>;
  firstName: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  language: InputMaybe<Scalars['String']['input']>;
  lastName: InputMaybe<Scalars['String']['input']>;
  mobileAppCustomerId: InputMaybe<Scalars['ID']['input']>;
  phoneNumber: InputMaybe<Scalars['String']['input']>;
  resultsReadyDate: InputMaybe<Scalars['String']['input']>;
};

export type UpdateReportDataOrderInput = {
  campaign: InputMaybe<Scalars['String']['input']>;
  coupon: InputMaybe<Scalars['String']['input']>;
  details: InputMaybe<Scalars['String']['input']>;
  discount: InputMaybe<Scalars['Float']['input']>;
  id: Scalars['ID']['input'];
  orderDate: InputMaybe<Scalars['String']['input']>;
  orderSource: InputMaybe<Scalars['String']['input']>;
  paymentMethod: InputMaybe<Scalars['String']['input']>;
  price: InputMaybe<Scalars['Float']['input']>;
  products: InputMaybe<Array<InputMaybe<ReportDataProductInput>>>;
  reportDataCustomerOrdersId: InputMaybe<Scalars['ID']['input']>;
  reportDataOrderMobileAppOrderIdId: InputMaybe<Scalars['ID']['input']>;
  vatRate: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateResultInput = {
  description: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name: InputMaybe<Scalars['String']['input']>;
  owner: InputMaybe<Scalars['ID']['input']>;
  productResultsId: InputMaybe<Scalars['ID']['input']>;
  sampleResultsId: InputMaybe<Scalars['ID']['input']>;
  value: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateSampleInput = {
  description: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name: InputMaybe<Scalars['String']['input']>;
  owner: InputMaybe<Scalars['ID']['input']>;
  phoneNumber: InputMaybe<Scalars['AWSPhone']['input']>;
  sampleCustomerId: InputMaybe<Scalars['ID']['input']>;
  status: InputMaybe<SampleStatus>;
};

export type UpdateWebadminSampleInput = {
  batchNumber: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['ID']['input'];
  name: InputMaybe<Scalars['String']['input']>;
  status: InputMaybe<WebadminSampleStatus>;
  webadminSampleCustomerId: InputMaybe<Scalars['ID']['input']>;
};

export type WebadminSample = {
  __typename?: 'WebadminSample';
  batchNumber: Maybe<Scalars['Int']['output']>;
  createdAt: Scalars['AWSDateTime']['output'];
  customer: Maybe<Customer>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  status: WebadminSampleStatus;
  updatedAt: Scalars['AWSDateTime']['output'];
  webadminSampleCustomerId: Scalars['ID']['output'];
};

export enum WebadminSampleStatus {
  InGenotyping = 'IN_GENOTYPING',
  Ready = 'READY',
  Received = 'RECEIVED',
  SentToCustomer = 'SENT_TO_CUSTOMER',
  SentToLab = 'SENT_TO_LAB'
}

export type ProductFragment = { __typename?: 'Product', id: string, name: string, productCode: string };

export type UserOrderFragment = { __typename?: 'OrderPackage', id: string, package: { __typename?: 'Package', id: string, name: string | null, productCode: number | null, productType: ProductType | null, createdAt: any } };

export type GetUserOrdersAndPackagesQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  nextToken: InputMaybe<Scalars['String']['input']>;
}>;


export type GetUserOrdersAndPackagesQuery = { __typename?: 'Query', orderByOwner: { __typename?: 'ModelOrderConnection', nextToken: string | null, items: Array<{ __typename?: 'Order', id: string, packages: { __typename?: 'ModelOrderPackageConnection', items: Array<{ __typename?: 'OrderPackage', id: string, package: { __typename?: 'Package', id: string, name: string | null, productCode: number | null, productType: ProductType | null, createdAt: any } } | null> } | null } | null> } | null };

export type UserResultFragment = { __typename?: 'Result', id: string, name: string, description: string | null, createdAt: any, sampleResultsId: string | null, productResultsId: string | null };

export type ListUserResultsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  nextToken: InputMaybe<Scalars['String']['input']>;
}>;


export type ListUserResultsQuery = { __typename?: 'Query', resultByOwner: { __typename?: 'ModelResultConnection', nextToken: string | null, items: Array<{ __typename?: 'Result', id: string, name: string, description: string | null, createdAt: any, sampleResultsId: string | null, productResultsId: string | null } | null> } | null };

export type ListProductsQueryVariables = Exact<{
  nextToken: InputMaybe<Scalars['String']['input']>;
}>;


export type ListProductsQuery = { __typename?: 'Query', listProducts: { __typename?: 'ModelProductConnection', nextToken: string | null, items: Array<{ __typename?: 'Product', id: string, name: string, productCode: string } | null> } | null };

export const ProductFragmentDoc = gql`
    fragment Product on Product {
  id
  name
  productCode
}
    `;
export const UserOrderFragmentDoc = gql`
    fragment UserOrder on OrderPackage {
  id
  package {
    id
    name
    productCode
    productType
    createdAt
  }
}
    `;
export const UserResultFragmentDoc = gql`
    fragment UserResult on Result {
  id
  name
  description
  createdAt
  sampleResultsId
  productResultsId
}
    `;
export const GetUserOrdersAndPackagesDocument = gql`
    query GetUserOrdersAndPackages($userId: ID!, $nextToken: String) {
  orderByOwner(
    owner: $userId
    limit: 100
    nextToken: $nextToken
    sortDirection: DESC
  ) {
    items {
      id
      packages(limit: 1000) {
        items {
          ...UserOrder
        }
      }
    }
    nextToken
  }
}
    ${UserOrderFragmentDoc}`;
export const ListUserResultsDocument = gql`
    query ListUserResults($userId: ID!, $nextToken: String) {
  resultByOwner(
    owner: $userId
    limit: 1000
    nextToken: $nextToken
    sortDirection: DESC
  ) {
    items {
      ...UserResult
    }
    nextToken
  }
}
    ${UserResultFragmentDoc}`;
export const ListProductsDocument = gql`
    query ListProducts($nextToken: String) {
  listProducts(limit: 1000, nextToken: $nextToken) {
    items {
      ...Product
    }
    nextToken
  }
}
    ${ProductFragmentDoc}`;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    GetUserOrdersAndPackages(variables: GetUserOrdersAndPackagesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<GetUserOrdersAndPackagesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetUserOrdersAndPackagesQuery>(GetUserOrdersAndPackagesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetUserOrdersAndPackages', 'query', variables);
    },
    ListUserResults(variables: ListUserResultsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<ListUserResultsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListUserResultsQuery>(ListUserResultsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListUserResults', 'query', variables);
    },
    ListProducts(variables?: ListProductsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<ListProductsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListProductsQuery>(ListProductsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ListProducts', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;