import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_button.dart';

class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({super.key});
  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final TextEditingController otpController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  int cooldown = 0;
  Timer? timer;
  bool loading = false;
  String? error;
  String? successMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  void startCooldown() {
    setState(() => cooldown = 60);
    timer?.cancel();
    timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (cooldown <= 1) {
        t.cancel();
        setState(() => cooldown = 0);
      } else {
        setState(() => cooldown--);
      }
    });
  }

  Future<void> _verifyCode() async {
    final code = otpController.text.trim();
    if (code.length != 6) {
      setState(() => error = 'Vui lòng nhập đầy đủ 6 chữ số.');
      return;
    }

    setState(() {
      loading = true;
      error = null;
      successMessage = null;
    });

    try {
      final appState = context.read<AppState>();
      await appState.authRepository.verifyOtpCode(code);
      if (mounted) {
        setState(() {
          successMessage = 'Xác thực email thành công!';
        });
      }
      await appState.refresh();
    } catch (e) {
      if (mounted) {
        setState(() {
          error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  Future<void> _resendCode() async {
    setState(() {
      error = null;
      successMessage = null;
      loading = true;
    });

    try {
      final appState = context.read<AppState>();
      await appState.authRepository.resendVerification();
      if (mounted) {
        startCooldown();
        setState(() {
          successMessage = 'Đã gửi lại mã xác thực mới đến email của bạn.';
        });
        otpController.clear();
        _focusNode.requestFocus();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  @override
  void dispose() {
    timer?.cancel();
    otpController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final email = state.appUser?.email ?? 'phụ huynh';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Xác thực tài khoản'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.of(context).pop();
            } else {
              context.go('/login');
            }
          },
        ),
        actions: [
          IconButton(
            onPressed: () async {
              await state.logout();
              await state.refresh();
            },
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Đăng xuất',
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Icon(
                Icons.mark_email_read_rounded,
                size: 80,
                color: AppColors.primary,
              ),
              const SizedBox(height: 24),
              const Text(
                'Nhập mã xác thực',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: AppColors.text,
                ),
              ),
              const SizedBox(height: 12),
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: const TextStyle(
                    fontSize: 16,
                    color: AppColors.muted,
                    height: 1.5,
                  ),
                  children: [
                    const TextSpan(text: 'Vui lòng nhập mã xác thực gồm '),
                    const TextSpan(
                      text: '6 chữ số',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.text,
                      ),
                    ),
                    const TextSpan(text: ' đã được gửi đến email:\n'),
                    TextSpan(
                      text: email,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              GestureDetector(
                onTap: () => _focusNode.requestFocus(),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Opacity(
                      opacity: 0,
                      child: SizedBox(
                        height: 40,
                        width: double.infinity,
                        child: TextField(
                          controller: otpController,
                          focusNode: _focusNode,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          showCursor: false,
                          decoration: const InputDecoration(counterText: ''),
                          onChanged: (val) {
                            setState(() {});
                            if (val.length == 6) {
                              _verifyCode();
                            }
                          },
                        ),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: List.generate(6, (index) {
                        final text = otpController.text;
                        String char = '';
                        if (index < text.length) {
                          char = text[index];
                        }
                        final isFocused =
                            _focusNode.hasFocus && index == text.length;

                        return Container(
                          width: 44,
                          height: 56,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isFocused
                                  ? AppColors.primary
                                  : AppColors.border,
                              width: isFocused ? 2.5 : 1.5,
                            ),
                            boxShadow: isFocused
                                ? [
                                    BoxShadow(
                                      color: AppColors.primary.withValues(
                                        alpha: 0.15,
                                      ),
                                      blurRadius: 8,
                                      offset: const Offset(0, 4),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Text(
                            char,
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppColors.text,
                            ),
                          ),
                        );
                      }),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Mã xác thực có hiệu lực trong vòng 30 phút.',
                style: TextStyle(
                  fontSize: 13,
                  fontStyle: FontStyle.italic,
                  color: AppColors.muted,
                ),
              ),
              const SizedBox(height: 32),
              if (error != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppColors.error.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        color: AppColors.error,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          error!,
                          style: const TextStyle(
                            color: AppColors.error,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              if (successMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle_outline_rounded,
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          successMessage!,
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              AppButton(
                label: 'Xác minh',
                icon: Icons.verified_user_rounded,
                loading: loading,
                onPressed: _verifyCode,
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: cooldown > 0 || loading ? null : _resendCode,
                icon: const Icon(Icons.send_rounded),
                label: Text(
                  cooldown > 0
                      ? 'Gửi lại sau ${cooldown}s'
                      : 'Gửi lại mã xác thực',
                ),
              ),

            ],
          ),
        ),
      ),
    );
  }
}
