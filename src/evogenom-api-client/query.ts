import { gql } from 'graphql-request';

export const ProductFragment = gql`
  fragment Product on Product {
    id
    name
    productCode
  }
`;

export const UserOrderFragement = gql`
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

export const UserOrders = gql`
  ${UserOrderFragement}
  query ListUserOrders($userId: String!, $nextToken: String) {
    listOrderPackages(
      filter: { owner: { eq: $userId } }
      limit: 1000
      nextToken: $nextToken
    ) {
      items {
        ...UserOrder
      }
      nextToken
    }
  }
`;

export const UserResultFragment = gql`
  fragment UserResult on Result {
    id
    name
    description
    createdAt
    sampleResultsId
    productResultsId
  }
`;

export const UserResults = gql`
  ${UserResultFragment}
  query ListUserResults($userId: ID!, $nextToken: String) {
    listResults(
      filter: { owner: { eq: $userId } }
      limit: 1000
      nextToken: $nextToken
    ) {
      items {
        ...UserResult
      }
      nextToken
    }
  }
`;

export const ListProductsQuery = gql`
  ${ProductFragment}
  query ListProducts($nextToken: String) {
    listProducts(limit: 1000, nextToken: $nextToken) {
      items {
        ...Product
      }
      nextToken
    }
  }
`;
