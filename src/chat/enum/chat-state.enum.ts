export enum ChatState {
  NOT_ALLOWED = 'NOT_ALLOWED', // User has not made a purchase
  NEW_USER = 'NEW_USER', // User has made purchase, but not onboarded
  ALLOWED = 'ALLOWED', // User has made purchase & onboarded
}
