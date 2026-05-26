import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/utils/api_error_mapper.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon_button.dart';
import '../../../core/widgets/password_field.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});
  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final formKey = GlobalKey<FormState>();
  final current = TextEditingController();
  final next = TextEditingController();
  final confirm = TextEditingController();
  String? message;
  bool loading = false;

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    setState(() => loading = true);
    try {
      await context.read<AppState>().authRepository.changePassword(
        current.text,
        next.text,
      );
      if (mounted) setState(() => message = 'Đã đổi mật khẩu.');
    } catch (e) {
      if (mounted) setState(() => message = friendlyApiError(e));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Đổi mật khẩu'),
      leadingWidth: 64,
      leading: Padding(
        padding: const EdgeInsets.only(left: 12.0),
        child: Center(
          child: AppIconButton(
            icon: Icons.arrow_back_ios_new_rounded,
            tooltip: 'Trở lại',
            onPressed: () {
              if (Navigator.canPop(context)) {
                Navigator.of(context).pop();
              } else {
                context.go('/profile');
              }
            },
          ),
        ),
      ),
    ),
    body: Form(
      key: formKey,
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          PasswordField(
            controller: current,
            label: 'Mật khẩu hiện tại',
            validator: Validators.password,
          ),
          const SizedBox(height: 12),
          PasswordField(
            controller: next,
            label: 'Mật khẩu mới',
            validator: Validators.password,
          ),
          const SizedBox(height: 12),
          PasswordField(
            controller: confirm,
            label: 'Nhập lại mật khẩu mới',
            validator: (v) =>
                v != next.text ? 'Mật khẩu nhập lại chưa khớp.' : null,
          ),
          const SizedBox(height: 16),
          AppButton(
            label: 'Cập nhật',
            icon: Icons.lock_reset_rounded,
            loading: loading,
            onPressed: submit,
          ),
          if (message != null)
            Padding(
              padding: const EdgeInsets.only(top: 14),
              child: Text(message!),
            ),
        ],
      ),
    ),
  );
}
