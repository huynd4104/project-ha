import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/firebase_error_mapper.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/password_field.dart';
import '../../../core/widgets/progress_bar.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final formKey = GlobalKey<FormState>();
  final name = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  final confirm = TextEditingController();
  bool accepted = false;
  bool loading = false;
  String? error;

  Future<void> submit() async {
    if (!accepted) {
      setState(() => error = 'Bạn cần xác nhận disclaimer trước khi đăng ký.');
      return;
    }
    if (!formKey.currentState!.validate()) return;
    setState(() => loading = true);
    try {
      await context.read<AppState>().authRepository.register(
        name.text,
        email.text,
        password.text,
      );
      await context.read<AppState>().refresh();
    } catch (e) {
      setState(() => error = friendlyFirebaseError(e));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final score = Validators.passwordScore(password.text) / 4;
    return Scaffold(
      appBar: AppBar(title: const Text('Tạo tài khoản')),
      body: SafeArea(
        child: Form(
          key: formKey,
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              AppTextField(
                controller: name,
                label: 'Họ tên phụ huynh',
                icon: Icons.badge_rounded,
                validator: (v) => Validators.required(v, 'Họ tên'),
              ),
              const SizedBox(height: 12),
              AppTextField(
                controller: email,
                label: 'Email',
                icon: Icons.email_rounded,
                validator: Validators.email,
              ),
              const SizedBox(height: 12),
              PasswordField(
                controller: password,
                label: 'Mật khẩu',
                validator: Validators.password,
              ),
              const SizedBox(height: 8),
              AnimatedBuilder(
                animation: password,
                builder: (_, __) => ProgressBar(
                  value: score,
                  color: score < .5 ? AppColors.orange : AppColors.primary,
                ),
              ),
              const SizedBox(height: 12),
              PasswordField(
                controller: confirm,
                label: 'Nhập lại mật khẩu',
                validator: (v) =>
                    v != password.text ? 'Mật khẩu nhập lại chưa khớp.' : null,
              ),
              CheckboxListTile(
                value: accepted,
                onChanged: (v) => setState(() => accepted = v ?? false),
                title: const Text(
                  'Tôi hiểu ứng dụng không chẩn đoán, không điều trị và không thay thế chuyên gia.',
                ),
                controlAffinity: ListTileControlAffinity.leading,
              ),
              if (error != null)
                Text(
                  error!,
                  style: const TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              const SizedBox(height: 10),
              AppButton(
                label: 'Đăng ký',
                icon: Icons.person_add_alt_1_rounded,
                loading: loading,
                onPressed: submit,
              ),
              TextButton(
                onPressed: () => context.go('/login'),
                child: const Text('Đã có tài khoản? Đăng nhập'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
