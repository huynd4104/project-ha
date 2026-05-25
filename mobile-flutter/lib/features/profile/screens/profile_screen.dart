import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/services/sound_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_button.dart';
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
    final user = state.appUser;

    return Scaffold(
      backgroundColor: const Color(0xFFF7FAF5),
      appBar: AppBar(
        title: const Text(
          'Tài khoản',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
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
        surfaceTintColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // ── Profile header card ─────────────────────────────
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: .04),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.primary, AppColors.teal],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(
                      (user?.fullName?.isNotEmpty == true)
                          ? user!.fullName![0].toUpperCase()
                          : '?',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.fullName ?? 'Phụ huynh',
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: AppColors.text,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        user?.email ?? '',
                        style: const TextStyle(fontSize: 13, color: AppColors.muted),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            state.emailVerified
                                ? Icons.verified_rounded
                                : Icons.error_outline_rounded,
                            size: 13,
                            color: state.emailVerified ? AppColors.primary : AppColors.error,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            state.emailVerified ? 'Email đã xác thực' : 'Email chưa xác thực',
                            style: TextStyle(
                              fontSize: 12,
                              color: state.emailVerified ? AppColors.primary : AppColors.error,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // ── Edit name ───────────────────────────────────────
          _SectionLabel(label: 'Thông tin cá nhân'),
          const SizedBox(height: 10),
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

          const SizedBox(height: 20),

          // ── Account actions ─────────────────────────────────
          _SectionLabel(label: 'Quản lý tài khoản'),
          const SizedBox(height: 10),
          _ActionTile(
            icon: Icons.child_care_rounded,
            color: AppColors.sky,
            label: 'Sửa hồ sơ bé',
            onTap: () => context.push('/child-profile'),
          ),
          const SizedBox(height: 8),
          _ActionTile(
            icon: Icons.lock_reset_rounded,
            color: AppColors.purple,
            label: 'Đổi mật khẩu',
            onTap: () => context.push('/change-password'),
          ),
          if (!state.emailVerified) ...[
            const SizedBox(height: 8),
            _ActionTile(
              icon: Icons.mark_email_read_rounded,
              color: AppColors.orange,
              label: 'Xác thực email ngay',
              onTap: () => context.push('/verify-email'),
            ),
          ],

          const SizedBox(height: 20),

          // ── Accessibility ───────────────────────────────────
          _SectionLabel(label: 'Trợ năng'),
          const SizedBox(height: 10),
          AppCard(
            child: Column(
              children: [
                _SwitchRow(
                  label: 'Chữ lớn',
                  icon: Icons.text_fields_rounded,
                  value: state.largeText,
                  onChanged: state.setLargeText,
                ),
                _Divider(),
                _SwitchRow(
                  label: 'Tương phản cao',
                  icon: Icons.contrast_rounded,
                  value: state.highContrast,
                  onChanged: state.setHighContrast,
                ),
                _Divider(),
                _SwitchRow(
                  label: 'Giảm chuyển động',
                  icon: Icons.motion_photos_off_rounded,
                  value: state.reducedAnimation,
                  onChanged: state.setReducedAnimation,
                ),
                _Divider(),
                _SwitchRow(
                  label: 'Âm thanh',
                  icon: Icons.volume_up_rounded,
                  value: SoundService.instance.enabled,
                  onChanged: state.setSoundEnabled,
                ),
                _Divider(),
                _SwitchRow(
                  label: 'Hướng dẫn bằng âm thanh',
                  icon: Icons.record_voice_over_rounded,
                  value: state.audioInstructions,
                  onChanged: state.setAudioInstructions,
                ),
                _Divider(),
                _SwitchRow(
                  label: 'Tự lặp lại hướng dẫn',
                  icon: Icons.repeat_rounded,
                  value: state.repeatInstructions,
                  onChanged: state.setRepeatInstructions,
                ),
                _Divider(),
                _SwitchRow(
                  label: 'Rung phản hồi',
                  icon: Icons.vibration_rounded,
                  value: state.hapticFeedback,
                  onChanged: state.setHapticFeedback,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── Logout ──────────────────────────────────────────
          _LogoutButton(onPressed: state.logout),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label.toUpperCase(),
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        color: AppColors.muted,
        letterSpacing: 0.8,
      ),
    );
  }
}

class _ActionTile extends StatefulWidget {
  const _ActionTile({
    required this.icon,
    required this.color,
    required this.label,
    required this.onTap,
  });
  final IconData icon;
  final Color color;
  final String label;
  final VoidCallback onTap;

  @override
  State<_ActionTile> createState() => _ActionTileState();
}

class _ActionTileState extends State<_ActionTile> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: _hover ? widget.color.withValues(alpha: .06) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _hover ? widget.color.withValues(alpha: .3) : AppColors.border,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: widget.color.withValues(alpha: .12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(widget.icon, color: widget.color, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  widget.label,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.text,
                  ),
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.muted, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _SwitchRow extends StatelessWidget {
  const _SwitchRow({
    required this.label,
    required this.icon,
    required this.value,
    required this.onChanged,
  });
  final String label;
  final IconData icon;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 18, color: value ? AppColors.primary : AppColors.muted),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.text),
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.primary,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ],
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Divider(height: 1, color: Color(0xFFF1F5F9));
  }
}

class _LogoutButton extends StatefulWidget {
  const _LogoutButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  State<_LogoutButton> createState() => _LogoutButtonState();
}

class _LogoutButtonState extends State<_LogoutButton> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: GestureDetector(
        onTap: widget.onPressed,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: _hover ? const Color(0xFFFFF1F2) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _hover ? AppColors.error.withValues(alpha: .4) : AppColors.border,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.logout_rounded,
                size: 18,
                color: AppColors.error,
              ),
              const SizedBox(width: 8),
              const Text(
                'Đăng xuất',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.error,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
