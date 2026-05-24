import 'package:flutter/material.dart';

import '../../../core/widgets/app_button.dart';

class AudioButton extends StatelessWidget {
  const AudioButton({super.key, this.onPressed, this.label = 'Nghe lại'});
  final VoidCallback? onPressed;
  final String label;

  @override
  Widget build(BuildContext context) => AppButton(
    label: label,
    icon: Icons.volume_up_rounded,
    variant: AppButtonVariant.secondary,
    onPressed: onPressed,
  );
}
