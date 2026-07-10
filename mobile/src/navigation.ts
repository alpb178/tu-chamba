export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  List: undefined;
  Detail: { id: string };
  NewAd: { id?: string } | undefined;
};
