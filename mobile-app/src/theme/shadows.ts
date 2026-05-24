import { Platform } from "react-native";

export const shadows = {
  soft: Platform.select({
    ios: {
      shadowColor: "#25323A",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    default: {
      elevation: 3,
    },
  }),
  lift: Platform.select({
    ios: {
      shadowColor: "#25323A",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    default: {
      elevation: 5,
    },
  }),
};
