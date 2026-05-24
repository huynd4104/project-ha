import { AppButton } from "./ui/AppButton";

export function LoadingButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  secondary = false,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  return (
    <AppButton
      title={title}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      variant={danger ? "danger" : secondary ? "secondary" : "primary"}
    />
  );
}
