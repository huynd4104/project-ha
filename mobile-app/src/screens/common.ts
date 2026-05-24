import { StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export const common = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: colors.background, 
    padding: spacing.screen 
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32
  },
  title: { 
    ...typography.title,
    color: colors.text, 
    marginBottom: 8,
    letterSpacing: 0
  },
  subtitle: { 
    ...typography.body,
    color: colors.muted, 
    marginBottom: 16 
  },
  panel: { 
    backgroundColor: colors.card, 
    borderRadius: radius.xl, 
    padding: 16, 
    borderWidth: 2, 
    borderColor: colors.border, 
    borderBottomWidth: 5,
    borderBottomColor: "#D1D5DB",
    marginBottom: 16 
  },
  label: { 
    ...typography.button,
    color: colors.text, 
    marginBottom: 8 
  },
  option: { 
    backgroundColor: "white", 
    borderWidth: 2, 
    borderColor: "#E5E7EB", 
    padding: 16, 
    borderRadius: 16, 
    borderBottomWidth: 4,
    borderBottomColor: "#D1D5DB",
    marginVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  selected: { 
    borderColor: "#58CC02", 
    borderBottomColor: "#46A302", 
    backgroundColor: "#EFFEED" 
  },
  correct: {
    borderColor: "#22C55E",
    borderBottomColor: "#16A34A",
    backgroundColor: "#DCFCE7"
  },
  incorrect: {
    borderColor: "#EF4444",
    borderBottomColor: "#DC2626",
    backgroundColor: "#FEE2E2"
  },
  optionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4B5563"
  },
  optionTextSelected: {
    color: "#15803D"
  },
  optionTextCorrect: {
    color: "#166534"
  },
  optionTextIncorrect: {
    color: "#991B1B"
  },
  
  // Progress Bar
  progressContainer: {
    height: 16,
    width: "100%",
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#58CC02",
    borderRadius: 8
  },
  
  // Streak & Pill styles
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8
  },
  pillText: {
    fontWeight: "900",
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 4
  }
});
