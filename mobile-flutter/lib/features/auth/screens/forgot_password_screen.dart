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

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final formKey = GlobalKey<FormState>();
  final email = TextEditingController();
  String? message;
  bool isSuccess = false;
  bool loading = false;

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    setState(() => loading = true);
    try {
      await context.read<AppState>().authRepository.sendPasswordReset(email.text);
      if (mounted) {
        setState(() {
          message = 'Email đặt lại mật khẩu đã được gửi.\nVui lòng kiểm tra hộp thư của bạn.';
          isSuccess = true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          message = friendlyApiError(e);
          isSuccess = false;
        });
      }
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
            padding: const EdgeInsets.symmetric(horizontal: 24),
            children: [
              const SizedBox(height: 32),

              Align(
                alignment: Alignment.centerLeft,
                child: AuthBackChip(onTap: () {
                  if (Navigator.canPop(context)) {
                    Navigator.of(context).pop();
                  } else {
                    context.go('/login');
                  }
                }),
              ),
              const SizedBox(height: 28),

              // ── Header icon ───────────────────────────────
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.lock_reset_rounded, color: AppColors.sky, size: 28),
              ),
              const SizedBox(height: 16),
              const Text(
                'Quên mật khẩu?',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: AppColors.text,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Nhập email đã đăng ký, chúng tôi sẽ gửi\nliên kết đặt lại mật khẩu cho bạn.',
                style: TextStyle(fontSize: 14, color: AppColors.muted, height: 1.5),
              ),
              const SizedBox(height: 28),

              AppTextField(
                controller: email,
                label: 'Email',
                icon: Icons.email_rounded,
                keyboardType: TextInputType.emailAddress,
                validator: Validators.email,
              ),
              const SizedBox(height: 20),

              AppButton(
                label: 'Gửi email đặt lại',
                icon: Icons.mark_email_read_rounded,
                loading: loading,
                onPressed: submit,
              ),

              if (message != null) ...[
                const SizedBox(height: 16),
                AuthBanner(message: message!, isSuccess: isSuccess),
              ],

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
