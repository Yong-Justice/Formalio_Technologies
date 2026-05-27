export type RootStackParamList = {
  FicheScreen: undefined;
  FicheDetail: { ficheId: string };
  RetraitScreen: undefined;
  VersementsScreen: undefined;
  DataRestoreScreen: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
  CookiePolicy: undefined;
  AcceptableUsePolicy: undefined;
  RefundSubscriptionPolicy: undefined;
  CommunityGuidelines: undefined;
  DmcaPolicy: undefined;
  DataRetentionPolicy: undefined;
  SecurityPolicy: undefined;
  RegulatoryCompliance: undefined;
} & Record<string, object | undefined>;
