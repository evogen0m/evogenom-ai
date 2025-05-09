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
  query GetUserOrdersAndPackages($userId: ID!, $nextToken: String) {
    orderByOwner(
      owner: $userId
      limit: 1000
      nextToken: $nextToken
      sortDirection: DESC
    ) {
      # Adjust limit/sort as needed
      items {
        # These are Order items
        id # Include Order ID if needed
        packages(limit: 1000) {
          # Fetch packages for each order, adjust limit
          items {
            # These are OrderPackage items
            ...UserOrder
          }
          # nextToken # Can add if inner pagination is needed
        }
      }
      nextToken # For the top-level orderByOwner query
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
    value
  }
`;

export const UserResults = gql`
  ${UserResultFragment}
  query ListUserResults($userId: ID!, $nextToken: String) {
    resultByOwner(
      owner: $userId
      limit: 1000
      nextToken: $nextToken
      sortDirection: DESC # Optional: Add sorting if needed, default might vary
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
