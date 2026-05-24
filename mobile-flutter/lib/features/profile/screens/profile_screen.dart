import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/services/sound_service.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_card.dart';
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
      appBar: AppBar(
        title: const Text('Tài khoản', style: TextStyle(fontWeight: FontWeight.w900)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.of(context).pop();
            } else {
              context.go('/home');
            }
          },
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.text,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 14),
          Text(
            user?.email ?? '',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(
            state.emailVerified ? 'Email đã xác thực' : 'Email chưa xác thực',
            style: TextStyle(
              color: state.emailVerified ? AppColors.primary : AppColors.error,
              fontWeight: FontWeight.bold,
            ),
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
          if (!state.emailVerified)
            OutlinedButton.icon(
              onPressed: () => context.push('/verify-email'),
              icon: const Icon(Icons.mark_email_read_rounded),
              label: const Text('Xác thực email ngay'),
            ),
          OutlinedButton.icon(
            onPressed: () => context.push('/child-profile'),
            icon: const Icon(Icons.child_care_rounded),
            label: const Text('Sửa hồ sơ bé'),
          ),
          const SizedBox(height: 20),
          Text('Trợ năng', style: AppTextStyles.title),
          const SizedBox(height: 10),
          AppCard(
            child: Column(
              children: [
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Chữ lớn'),
                  value: state.largeText,
                  onChanged: state.setLargeText,
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Tương phản cao'),
                  value: state.highContrast,
                  onChanged: state.setHighContrast,
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Giảm chuyển động'),
                  value: state.reducedAnimation,
                  onChanged: state.setReducedAnimation,
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Âm thanh'),
                  value: SoundService.instance.enabled,
                  onChanged: state.setSoundEnabled,
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Hướng dẫn bằng âm thanh'),
                  value: state.audioInstructions,
                  onChanged: state.setAudioInstructions,
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Tự lặp lại hướng dẫn'),
                  value: state.repeatInstructions,
                  onChanged: state.setRepeatInstructions,
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Rung phản hồi'),
                  value: state.hapticFeedback,
                  onChanged: state.setHapticFeedback,
                ),
              ],
            ),
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
