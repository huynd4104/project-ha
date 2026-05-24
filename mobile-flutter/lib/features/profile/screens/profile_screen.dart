import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final TextEditingController name;
  bool saving = false;

  @override
  void initState() {
    super.initState();
    name = TextEditingController(
      text: context.read<AppState>().appUser?.fullName ?? '',
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final user = state.firebaseUser;
    return Scaffold(
      appBar: AppBar(title: const Text('Tài khoản')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            user?.email ?? '',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(
            user?.emailVerified == true
                ? 'Email đã xác thực'
                : 'Email chưa xác thực',
          ),
          const SizedBox(height: 16),
          AppTextField(
            controller: name,
            label: 'Họ tên',
            icon: Icons.badge_rounded,
          ),
          const SizedBox(height: 12),
          AppButton(
            label: 'Lưu họ tên',
            icon: Icons.save_rounded,
            loading: saving,
            onPressed: () async {
              setState(() => saving = true);
              await state.authRepository.updateFullName(name.text);
              await state.refresh();
              if (mounted) setState(() => saving = false);
            },
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.push('/change-password'),
            icon: const Icon(Icons.lock_reset_rounded),
            label: const Text('Đổi mật khẩu'),
          ),
          OutlinedButton.icon(
            onPressed: state.authRepository.resendVerification,
            icon: const Icon(Icons.mark_email_read_rounded),
            label: const Text('Gửi lại email xác thực'),
          ),
          OutlinedButton.icon(
            onPressed: () => context.push('/child-profile'),
            icon: const Icon(Icons.child_care_rounded),
            label: const Text('Sửa hồ sơ bé'),
          ),
          const SizedBox(height: 18),
          FilledButton.tonalIcon(
            onPressed: state.logout,
            icon: const Icon(Icons.logout_rounded),
            label: const Text('Đăng xuất'),
          ),
        ],
      ),
    );
  }
}
