import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';

class ChildProfileScreen extends StatefulWidget {
  const ChildProfileScreen({super.key});
  @override
  State<ChildProfileScreen> createState() => _ChildProfileScreenState();
}

class _ChildProfileScreenState extends State<ChildProfileScreen> {
  final formKey = GlobalKey<FormState>();
  final name = TextEditingController();
  final age = TextEditingController();
  final note = TextEditingController();
  String gender = 'Không ghi';
  bool loading = false;

  @override
  void initState() {
    super.initState();
    final child = context.read<AppState>().activeChild;
    if (child != null) {
      name.text = child.name;
      age.text = '${child.age}';
      gender = child.gender.isEmpty ? gender : child.gender;
      note.text = child.note;
    }
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    final state = context.read<AppState>();
    setState(() => loading = true);
    final child = state.activeChild;
    if (child == null) {
      await state.childRepository.create(
        state.firebaseUser!.uid,
        name.text,
        int.parse(age.text),
        gender,
        note.text,
      );
    } else {
      await state.childRepository.update(
        child.copyWith(
          name: name.text,
          age: int.parse(age.text),
          gender: gender,
          note: note.text,
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
