import 'dart:async';

import 'package:flutter/material.dart';
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
  int cooldown = 0;
  Timer? timer;

  void startCooldown() {
    setState(() => cooldown = 60);
    timer?.cancel();
    timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (cooldown <= 1) {
        t.cancel();
        setState(() => cooldown = 0);
      } else {
        setState(() => cooldown--);
      }
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Xác thực email')),
    body: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.verified_rounded, size: 74, color: AppColors.sky),
          const SizedBox(height: 16),
          const Text(
            'Vui lòng kiểm tra email để xác thực tài khoản.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 18),
          AppButton(
            label: 'Tôi đã xác thực',
            icon: Icons.refresh_rounded,
            onPressed: () async {
              await context.read<AppState>().authRepository.reloadUser();
              await context.read<AppState>().refresh();
            },
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: cooldown > 0
                ? null
                : () async {
                    await context
                        .read<AppState>()
                        .authRepository
                        .resendVerification();
                    startCooldown();
                  },
            icon: const Icon(Icons.send_rounded),
            label: Text(
              cooldown > 0 ? 'Gửi lại sau ${cooldown}s' : 'Gửi lại email',
            ),
          ),
        ],
      ),
    ),
  );
}
