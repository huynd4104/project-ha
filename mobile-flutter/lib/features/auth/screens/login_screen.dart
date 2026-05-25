import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/api_error_mapper.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/auth_shared_widgets.dart';
import '../../../core/widgets/password_field.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final formKey = GlobalKey<FormState>();
  final email = TextEditingController();
  final password = TextEditingController();
  bool loading = false;
  String? error;

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    setState(() => loading = true);
    try {
      final appState = context.read<AppState>();
      await appState.authRepository.login(email.text, password.text);
      await appState.refresh();
    } catch (e) {
      if (mounted) setState(() => error = friendlyApiError(e));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7FAF5),
      body: SafeArea(
        child: Form(
          key: formKey,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 0),
            children: [
              const SizedBox(height: 32),

              // ── Back button row ───────────────────────────
              Align(
                alignment: Alignment.centerLeft,
                child: AuthBackChip(onTap: () {
                  if (Navigator.canPop(context)) {
                    Navigator.of(context).pop();
                  } else {
                    context.go('/');
                  }
                }),
              ),
              const SizedBox(height: 28),

              // ── Header ────────────────────────────────────
              const Text(
                'Chào mừng\nquay lại! 👋',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                  color: AppColors.text,
                  height: 1.25,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Đăng nhập để tiếp tục hành trình học của bé.',
                style: TextStyle(fontSize: 14, color: AppColors.muted, height: 1.5),
              ),
              const SizedBox(height: 32),

              // ── Fields ────────────────────────────────────
              AppTextField(
                controller: email,
                label: 'Email',
                icon: Icons.email_rounded,
                keyboardType: TextInputType.emailAddress,
                validator: Validators.email,
              ),
              const SizedBox(height: 14),
              PasswordField(
                controller: password,
                label: 'Mật khẩu',
                validator: Validators.password,
              ),
              const SizedBox(height: 12),

              // ── Forgot password ──────────────────────────
              Align(
                alignment: Alignment.centerRight,
                child: AuthTextLink(
                  label: 'Quên mật khẩu?',
                  onTap: () => context.go('/forgot'),
                ),
              ),

              // ── Error ────────────────────────────────────
              if (error != null) ...[
                const SizedBox(height: 8),
                AuthBanner(message: error!),
              ],

              const SizedBox(height: 20),

              // ── Submit ────────────────────────────────────
              AppButton(
                label: 'Đăng nhập',
                icon: Icons.login_rounded,
                loading: loading,
                onPressed: submit,
              ),
              const SizedBox(height: 20),

              // ── Switch to register ─────────────────────────
              Center(
                child: AuthTextLink(
                  label: 'Chưa có tài khoản? ',
                  highlight: 'Đăng ký',
                  onTap: () => context.go('/register'),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
