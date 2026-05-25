import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../models/models.dart';

class ChildProfileScreen extends StatefulWidget {
  const ChildProfileScreen({super.key});
  @override
  State<ChildProfileScreen> createState() => _ChildProfileScreenState();
}

class _ChildProfileScreenState extends State<ChildProfileScreen> {
  final formKey = GlobalKey<FormState>();
  final name = TextEditingController();
  final age = TextEditingController();
  final dailyDuration = TextEditingController(text: '5');
  final note = TextEditingController();
  String gender = 'Không ghi';
  DevelopmentCategoryKey primaryDifficulty = DevelopmentCategoryKey.other;
  final learningGoals = <LearningGoalKey>{};
  SupportLevel supportLevel = SupportLevel.medium;
  CoLearningMode coLearningMode = CoLearningMode.parentChildTogether;
  bool loading = false;

  @override
  void initState() {
    super.initState();
    final child = context.read<AppState>().activeChild;
    if (child != null) {
      name.text = child.name;
      age.text = '${child.age}';
      gender = child.gender.isEmpty ? gender : child.gender;
      primaryDifficulty = child.primaryDifficulty;
      learningGoals.addAll(child.learningGoals);
      supportLevel = child.supportLevel;
      dailyDuration.text = '${child.dailyDurationMinutes}';
      coLearningMode = child.coLearningMode;
      note.text = child.note;
    }
  }

  @override
  void dispose() {
    name.dispose();
    age.dispose();
    dailyDuration.dispose();
    note.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    final state = context.read<AppState>();
    setState(() => loading = true);
    final child = state.activeChild;
    if (child == null) {
      await state.childRepository.create(
        state.appUser!.id,
        name.text,
        int.parse(age.text),
        gender,
        note.text,
        primaryDifficulty: primaryDifficulty,
        learningGoals: learningGoals.toList(),
        supportLevel: supportLevel,
        dailyDurationMinutes: int.parse(dailyDuration.text),
        coLearningMode: coLearningMode,
      );
    } else {
      await state.childRepository.update(
        child.copyWith(
          name: name.text,
          age: int.parse(age.text),
          gender: gender,
          note: note.text,
          primaryDifficulty: primaryDifficulty,
          learningGoals: learningGoals.toList(),
          supportLevel: supportLevel,
          dailyDurationMinutes: int.parse(dailyDuration.text),
          coLearningMode: coLearningMode,
        ),
      );
    }
    await state.refresh();
    if (mounted) context.go('/home');
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Hồ sơ của bé'),
      leading: (Navigator.canPop(context) || context.read<AppState>().hasChild)
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              onPressed: () {
                if (Navigator.canPop(context)) {
                  Navigator.of(context).pop();
                } else {
                  context.go('/profile');
                }
              },
            )
          : null,
      actions: [
        TextButton(
          onPressed: () => context.read<AppState>().logout(),
          child: const Text('Đăng xuất'),
        ),
      ],
    ),
    body: Form(
      key: formKey,
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text(
            'Tạo hồ sơ để cá nhân hóa lộ trình học.',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 18),
          AppTextField(
            controller: name,
            label: 'Tên bé',
            icon: Icons.child_care_rounded,
            validator: (v) => Validators.required(v, 'Tên bé'),
          ),
          const SizedBox(height: 12),
          AppTextField(
            controller: age,
            label: 'Tuổi',
            icon: Icons.cake_rounded,
            keyboardType: TextInputType.number,
            validator: (v) =>
                int.tryParse(v ?? '') == null ? 'Tuổi chưa hợp lệ.' : null,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: gender,
            items: const [
              'Không ghi',
              'Nam',
              'Nữ',
            ].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
            onChanged: (v) => setState(() => gender = v ?? gender),
            decoration: const InputDecoration(labelText: 'Giới tính'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<DevelopmentCategoryKey>(
            value: primaryDifficulty,
            items: DevelopmentCategoryKey.values
                .map(
                  (value) =>
                      DropdownMenuItem(value: value, child: Text(value.label)),
                )
                .toList(),
            onChanged: (v) =>
                setState(() => primaryDifficulty = v ?? primaryDifficulty),
            decoration: const InputDecoration(labelText: 'Khó khăn chính'),
          ),
          const SizedBox(height: 12),
          Text(
            'Mục tiêu học tập',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: LearningGoalKey.values.map((goal) {
              final selected = learningGoals.contains(goal);
              return FilterChip(
                label: Text(goal.label),
                selected: selected,
                onSelected: (value) {
                  setState(() {
                    if (value) {
                      learningGoals.add(goal);
                    } else {
                      learningGoals.remove(goal);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<SupportLevel>(
            value: supportLevel,
            items: SupportLevel.values
                .map(
                  (value) =>
                      DropdownMenuItem(value: value, child: Text(value.label)),
                )
                .toList(),
            onChanged: (v) => setState(() => supportLevel = v ?? supportLevel),
            decoration: const InputDecoration(labelText: 'Mức hỗ trợ'),
          ),
          const SizedBox(height: 12),
          AppTextField(
            controller: dailyDuration,
            label: 'Thời lượng mỗi ngày (phút)',
            icon: Icons.timer_rounded,
            keyboardType: TextInputType.number,
            validator: (v) {
              final parsed = int.tryParse(v ?? '');
              if (parsed == null || parsed < 1) {
                return 'Thời lượng chưa hợp lệ.';
              }
              return null;
            },
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<CoLearningMode>(
            value: coLearningMode,
            items: CoLearningMode.values
                .map(
                  (value) =>
                      DropdownMenuItem(value: value, child: Text(value.label)),
                )
                .toList(),
            onChanged: (v) =>
                setState(() => coLearningMode = v ?? coLearningMode),
            decoration: const InputDecoration(labelText: 'Cách học cùng bé'),
          ),
          const SizedBox(height: 12),
          AppTextField(
            controller: note,
            label: 'Ghi chú cho phụ huynh',
            icon: Icons.notes_rounded,
            maxLines: 3,
          ),
          const SizedBox(height: 18),
          AppButton(
            label: 'Lưu hồ sơ',
            icon: Icons.check_rounded,
            loading: loading,
            onPressed: submit,
          ),
        ],
      ),
    ),
  );
}
