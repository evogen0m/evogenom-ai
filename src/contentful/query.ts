import { gql } from 'graphql-request';

// Note: Actual field names should match Contentful's content model
export const ResultRowFieldsFragment = gql`
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

export const ProductFieldsFragment = gql`
  fragment ProductFields on Product {
    sys {
      id
    }
    productCode
    name
  }
`;

export const GetResultsQuery = gql`
  ${ResultRowFieldsFragment}
  query GetResults(
    $productCodes: [String!]
    $limit: Int = 1000
    $skip: Int = 0
    $locale: String = "en-US"
  ) {
    resultRowCollection(
      where: { productCode_in: $productCodes }
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
`;

export const GetProductsQuery = gql`
  ${ProductFieldsFragment}
  query GetProducts(
    $productCodes: [Int!]
    $limit: Int = 1000
    $skip: Int = 0
    $locale: String = "en-US"
  ) {
    productCollection(
      where: { productCode_in: $productCodes }
      limit: $limit
      skip: $skip
      locale: $locale
    ) {
      total
      skip
      limit
      items {
        ...ProductFields
      }
    }
  }
`;
