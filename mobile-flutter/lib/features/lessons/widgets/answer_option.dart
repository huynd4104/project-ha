import 'package:flutter/material.dart';

import 'answer_option_card.dart';

class AnswerOption extends StatelessWidget {
  const AnswerOption({
    super.key,
    required this.label,
    required this.text,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final String text;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => AnswerOptionCard(
    label: label,
    text: text,
    state: selected ? AnswerOptionState.selected : AnswerOptionState.normal,
    onTap: onTap,
  );
}
