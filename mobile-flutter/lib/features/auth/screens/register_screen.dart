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
      setState(() => error = 'Bạn cần xác nhận tuyên bố miễn trừ trách nhiệm trước khi đăng ký.');
      return;
    }
    if (!formKey.currentState!.validate()) return;
    setState(() => loading = true);
    try {
      final appState = context.read<AppState>();
      await appState.authRepository.register(
        name.text,
        email.text,
        password.text,
      );
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
            padding: const EdgeInsets.symmetric(horizontal: 24),
            children: [
              const SizedBox(height: 32),

              // ── Back button ───────────────────────────────
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
                'Tạo tài khoản 🌱',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                  color: AppColors.text,
                  height: 1.25,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Điền thông tin để bắt đầu hành trình cùng bé.',
                style: TextStyle(fontSize: 14, color: AppColors.muted, height: 1.5),
              ),
              const SizedBox(height: 28),

              // ── Name ──────────────────────────────────────
              AppTextField(
                controller: name,
                label: 'Họ tên phụ huynh',
                icon: Icons.badge_rounded,
                validator: (v) => Validators.required(v, 'Họ tên'),
              ),
              const SizedBox(height: 14),

              // ── Email ─────────────────────────────────────
              AppTextField(
                controller: email,
                label: 'Email',
                icon: Icons.email_rounded,
                keyboardType: TextInputType.emailAddress,
                validator: Validators.email,
              ),
              const SizedBox(height: 14),

              // ── Password ──────────────────────────────────
              PasswordField(
                controller: password,
                label: 'Mật khẩu',
                validator: Validators.password,
              ),
              const SizedBox(height: 10),

              // ── Password hints ────────────────────────────
              ListenableBuilder(
                listenable: password,
                builder: (_, __) => _PasswordHints(value: password.text),
              ),
              const SizedBox(height: 14),

              // ── Confirm password ──────────────────────────
              PasswordField(
                controller: confirm,
                label: 'Nhập lại mật khẩu',
                validator: (v) =>
                    v != password.text ? 'Mật khẩu nhập lại chưa khớp.' : null,
              ),
              const SizedBox(height: 16),

              // ── Disclaimer checkbox ───────────────────────
              _DisclaimerCheckbox(
                value: accepted,
                onChanged: (v) => setState(() => accepted = v ?? false),
              ),

              // ── Error ─────────────────────────────────────
              if (error != null) ...[
                const SizedBox(height: 10),
                AuthBanner(message: error!),
              ],

              const SizedBox(height: 20),

              // ── Submit ────────────────────────────────────
              AppButton(
                label: 'Đăng ký',
                icon: Icons.person_add_alt_1_rounded,
                loading: loading,
                onPressed: submit,
              ),
              const SizedBox(height: 20),

              Center(
                child: AuthTextLink(
                  label: 'Đã có tài khoản? ',
                  highlight: 'Đăng nhập',
                  onTap: () => context.go('/login'),
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

// ─── Password hints ────────────────────────────────────────────────────────

class _PasswordHints extends StatelessWidget {
  const _PasswordHints({required this.value});
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Hint(label: '≥ 8 ký tự', met: value.length >= 8),
        const SizedBox(height: 4),
        _Hint(label: 'Có chữ hoa (A–Z)', met: RegExp(r'[A-Z]').hasMatch(value)),
        const SizedBox(height: 4),
        _Hint(label: 'Có chữ số (0–9)', met: RegExp(r'[0-9]').hasMatch(value)),
        const SizedBox(height: 4),
        _Hint(
          label: r'Có ký tự đặc biệt (!@#$...)',
          met: RegExp(r'[^A-Za-z0-9]').hasMatch(value),
        ),
      ],
    );
  }
}

class _Hint extends StatelessWidget {
  const _Hint({required this.label, required this.met});
  final String label;
  final bool met;

  @override
  Widget build(BuildContext context) {
    final color = met ? AppColors.primary : AppColors.muted;
    return Row(
      children: [
        Icon(
          met ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
          size: 15,
          color: color,
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: color,
            fontWeight: met ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}

// ─── Disclaimer checkbox ────────────────────────────────────────────────────

class _DisclaimerCheckbox extends StatelessWidget {
  const _DisclaimerCheckbox({required this.value, required this.onChanged});
  final bool value;
  final ValueChanged<bool?> onChanged;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: value ? const Color(0xFFF0FDF4) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: value ? AppColors.primary : AppColors.border,
            width: 1.5,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: Checkbox(
                value: value,
                onChanged: onChanged,
                activeColor: AppColors.primary,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Tôi hiểu ứng dụng không chẩn đoán, không điều trị và không thay thế chuyên gia y tế.',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.text,
                  height: 1.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
