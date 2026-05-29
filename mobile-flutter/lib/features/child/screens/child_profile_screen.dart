import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_icon_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../models/models.dart';

class ChildProfileScreen extends StatefulWidget {
  const ChildProfileScreen({super.key});
  @override
  State<ChildProfileScreen> createState() => _ChildProfileScreenState();
}

class _ChildProfileScreenState extends State<ChildProfileScreen> {
  final formKey = GlobalKey<FormState>();
  final name = TextEditingController();
  final age = TextEditingController();
  final dailyDuration = TextEditingController(text: '5');
  final note = TextEditingController();
  String gender = 'Không ghi';
  DevelopmentCategoryKey primaryDifficulty = DevelopmentCategoryKey.other;
  final learningGoals = <LearningGoalKey>{};
  SupportLevel supportLevel = SupportLevel.medium;
  CoLearningMode coLearningMode = CoLearningMode.parentChildTogether;
  bool loading = false;
  String? avatarUrl;
  String? avatarObjectKey;
  bool uploadingPhoto = false;
  XFile? _pickedLocalFile;

  // AI Support Profile Controllers
  final nickname = TextEditingController();
  final favoriteColors = TextEditingController();
  final favoriteAnimals = TextEditingController();
  final favoriteToys = TextEditingController();
  final favoriteSongs = TextEditingController();
  final favoriteActivities = TextEditingController();
  final preferredPraise = TextEditingController();
  final primaryCaregiver = TextEditingController();
  final familyMembers = TextEditingController();
  String communicationLevel = 'Chưa nói';
  final commonTriggers = TextEditingController();
  final calmingStrategies = TextEditingController();
  bool loadingProfile = false;

  @override
  void initState() {
    super.initState();
    final child = context.read<AppState>().activeChild;
    if (child != null) {
      name.text = child.name;
      age.text = '${child.age}';
      gender = child.gender.isEmpty ? gender : child.gender;
      primaryDifficulty = child.primaryDifficulty;
      learningGoals.addAll(child.learningGoals);
      supportLevel = child.supportLevel;
      dailyDuration.text = '${child.dailyDurationMinutes}';
      coLearningMode = child.coLearningMode;
      note.text = child.note;
      avatarUrl = child.avatarUrl;
      avatarObjectKey = child.avatarObjectKey;
      _loadDevelopmentProfile();
    }
  }

  Future<void> _loadDevelopmentProfile() async {
    final child = context.read<AppState>().activeChild;
    if (child == null) return;
    setState(() => loadingProfile = true);
    try {
      final repo = context.read<AppState>().childRepository;
      final profile = await repo.getDevelopmentProfile(child.id);
      setState(() {
        nickname.text = profile.nickname;
        favoriteColors.text = profile.favoriteColors;
        favoriteAnimals.text = profile.favoriteAnimals;
        favoriteToys.text = profile.favoriteToys;
        favoriteSongs.text = profile.favoriteSongs;
        favoriteActivities.text = profile.favoriteActivities;
        preferredPraise.text = profile.preferredPraise;
        primaryCaregiver.text = profile.primaryCaregiver;
        familyMembers.text = profile.familyMembers;
        communicationLevel = profile.communicationLevel.isNotEmpty ? profile.communicationLevel : 'Chưa nói';
        commonTriggers.text = profile.commonTriggers;
        calmingStrategies.text = profile.calmingStrategies;
      });
    } catch (e) {
      debugPrint('Error loading development profile: $e');
    } finally {
      if (mounted) {
        setState(() => loadingProfile = false);
      }
    }
  }

  @override
  void dispose() {
    name.dispose();
    age.dispose();
    dailyDuration.dispose();
    note.dispose();
    nickname.dispose();
    favoriteColors.dispose();
    favoriteAnimals.dispose();
    favoriteToys.dispose();
    favoriteSongs.dispose();
    favoriteActivities.dispose();
    preferredPraise.dispose();
    primaryCaregiver.dispose();
    familyMembers.dispose();
    commonTriggers.dispose();
    calmingStrategies.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadPhoto() async {
    final state = context.read<AppState>();
    final child = state.activeChild;

    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Chọn từ thư viện'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Chụp ảnh mới'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    final image = await picker.pickImage(
      source: source,
      maxWidth: 500,
      maxHeight: 500,
      imageQuality: 85,
    );

    if (image == null) return;

    if (child == null) {
      setState(() {
        _pickedLocalFile = image;
      });
      return;
    }

    setState(() => uploadingPhoto = true);

    try {
      final fileBytes = await image.readAsBytes();
      final fileName = image.name;

      final response = await state.childRepository.uploadAvatar(
        child.id,
        fileBytes,
        fileName,
      );

      setState(() {
        avatarUrl = response['avatarUrl'] as String?;
        avatarObjectKey = response['avatarObjectKey'] as String?;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tải ảnh lên thành công!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải ảnh: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => uploadingPhoto = false);
      }
    }
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    final state = context.read<AppState>();
    setState(() => loading = true);
    final child = state.activeChild;
    String targetChildId = '';
    try {
      if (child == null) {
        final newChild = await state.childRepository.create(
          state.appUser!.id,
          name.text,
          int.parse(age.text),
          gender,
          note.text,
          primaryDifficulty: primaryDifficulty,
          learningGoals: learningGoals.toList(),
          supportLevel: supportLevel,
          dailyDurationMinutes: int.parse(dailyDuration.text),
          coLearningMode: coLearningMode,
        );
        targetChildId = newChild.id;

        if (_pickedLocalFile != null) {
          final fileBytes = await _pickedLocalFile!.readAsBytes();
          await state.childRepository.uploadAvatar(
            newChild.id,
            fileBytes,
            _pickedLocalFile!.name,
          );
        }
      } else {
        targetChildId = child.id;
        await state.childRepository.update(
          child.copyWith(
            name: name.text,
            age: int.parse(age.text),
            gender: gender,
            note: note.text,
            primaryDifficulty: primaryDifficulty,
            learningGoals: learningGoals.toList(),
            supportLevel: supportLevel,
            dailyDurationMinutes: int.parse(dailyDuration.text),
            coLearningMode: coLearningMode,
            avatarUrl: avatarUrl,
            avatarObjectKey: avatarObjectKey,
          ),
        );
      }

      // Save development profile separately
      if (targetChildId.isNotEmpty) {
        try {
          await state.childRepository.updateDevelopmentProfile(
            targetChildId,
            {
              'nickname': nickname.text.trim(),
              'favoriteColors': favoriteColors.text.trim(),
              'favoriteAnimals': favoriteAnimals.text.trim(),
              'favoriteToys': favoriteToys.text.trim(),
              'favoriteSongs': favoriteSongs.text.trim(),
              'favoriteActivities': favoriteActivities.text.trim(),
              'preferredPraise': preferredPraise.text.trim(),
              'primaryCaregiver': primaryCaregiver.text.trim(),
              'familyMembers': familyMembers.text.trim(),
              'communicationLevel': communicationLevel,
              'commonTriggers': commonTriggers.text.trim(),
              'calmingStrategies': calmingStrategies.text.trim(),
            },
          );
        } catch (deve) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Hồ sơ AI chưa được cập nhật: $deve')),
            );
          }
        }
      }

      await state.refresh();
      if (mounted) context.go('/home');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi lưu hồ sơ: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  Widget _buildGenderSelector() {
    final options = ['Không ghi', 'Nam', 'Nữ'];
    final icons = [Icons.transgender_rounded, Icons.male_rounded, Icons.female_rounded];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Giới tính của bé',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.text),
        ),
        const SizedBox(height: 8),
        Row(
          children: List.generate(options.length, (index) {
            final opt = options[index];
            final isSelected = gender == opt;
            final optionColor = index == 1 ? AppColors.sky : (index == 2 ? AppColors.pink : AppColors.primary);
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  right: index == options.length - 1 ? 0 : 8.0,
                ),
                child: AppCard(
                  onTap: () => setState(() => gender = opt),
                  color: isSelected ? optionColor.withValues(alpha: 0.12) : Colors.white,
                  borderColor: isSelected ? optionColor : AppColors.border,
                  borderWidth: isSelected ? 2.5 : 1.5,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Column(
                    children: [
                      Icon(icons[index], color: isSelected ? optionColor : AppColors.muted, size: 20),
                      const SizedBox(height: 4),
                      Text(
                        opt,
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 13,
                          color: isSelected ? optionColor : AppColors.text,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildDifficultySelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Khó khăn chính của bé',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.text),
        ),
        const SizedBox(height: 8),
        ...DevelopmentCategoryKey.values.map((val) {
          final isSelected = primaryDifficulty == val;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: AppCard(
              onTap: () => setState(() => primaryDifficulty = val),
              color: isSelected ? AppColors.orange.withValues(alpha: 0.12) : Colors.white,
              borderColor: isSelected ? AppColors.orange : AppColors.border,
              borderWidth: isSelected ? 2.5 : 1.5,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Icon(
                    isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                    color: isSelected ? AppColors.orange : AppColors.muted,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      val.label,
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                        color: isSelected ? AppColors.orange : AppColors.text,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildLearningGoals() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Mục tiêu học tập',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.text),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: LearningGoalKey.values.map((goal) {
            final isSelected = learningGoals.contains(goal);
            return GestureDetector(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    learningGoals.remove(goal);
                  } else {
                    learningGoals.add(goal);
                  }
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.sky.withValues(alpha: 0.12) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? AppColors.sky : AppColors.border,
                    width: isSelected ? 2 : 1.5,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isSelected ? Icons.check_circle_rounded : Icons.add_circle_outline_rounded,
                      color: isSelected ? AppColors.sky : AppColors.muted,
                      size: 16,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      goal.label,
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                        color: isSelected ? AppColors.sky : AppColors.text,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildSupportLevelSelector() {
    final options = SupportLevel.values;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Mức độ hỗ trợ cần thiết',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.text),
        ),
        const SizedBox(height: 8),
        Row(
          children: List.generate(options.length, (index) {
            final lvl = options[index];
            final isSelected = supportLevel == lvl;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  right: index == options.length - 1 ? 0 : 8.0,
                ),
                child: AppCard(
                  onTap: () => setState(() => supportLevel = lvl),
                  color: isSelected ? AppColors.teal.withValues(alpha: 0.12) : Colors.white,
                  borderColor: isSelected ? AppColors.teal : AppColors.border,
                  borderWidth: isSelected ? 2.5 : 1.5,
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                  child: Column(
                    children: [
                      Icon(
                        index == 0
                            ? Icons.brightness_low_rounded
                            : (index == 1 ? Icons.brightness_medium_rounded : Icons.brightness_high_rounded),
                        color: isSelected ? AppColors.teal : AppColors.muted,
                        size: 20,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        lvl.label,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 11,
                          color: isSelected ? AppColors.teal : AppColors.text,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildCoLearningSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Cách học cùng bé',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.text),
        ),
        const SizedBox(height: 8),
        ...CoLearningMode.values.map((val) {
          final isSelected = coLearningMode == val;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: AppCard(
              onTap: () => setState(() => coLearningMode = val),
              color: isSelected ? AppColors.primary.withValues(alpha: 0.12) : Colors.white,
              borderColor: isSelected ? AppColors.primary : AppColors.border,
              borderWidth: isSelected ? 2.5 : 1.5,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Icon(
                    isSelected ? Icons.check_circle_rounded : Icons.radio_button_off_rounded,
                    color: isSelected ? AppColors.primary : AppColors.muted,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      val.label,
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                        color: isSelected ? AppColors.primary : AppColors.text,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Hồ sơ của bé'),
      leadingWidth: (Navigator.canPop(context) || context.read<AppState>().hasChild) ? 64 : null,
      leading: (Navigator.canPop(context) || context.read<AppState>().hasChild)
          ? Padding(
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
            )
          : null,
    ),
    body: Form(
      key: formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        children: [
          Center(
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 54,
                  backgroundColor: Colors.grey.shade200,
                  backgroundImage: _pickedLocalFile != null
                      ? FileImage(File(_pickedLocalFile!.path))
                      : (avatarUrl != null && avatarUrl!.isNotEmpty
                          ? NetworkImage(avatarUrl!)
                          : null) as ImageProvider?,
                  child: (_pickedLocalFile == null && (avatarUrl == null || avatarUrl!.isEmpty))
                      ? const Icon(
                          Icons.child_care_rounded,
                          size: 54,
                          color: Colors.grey,
                        )
                      : null,
                ),
                if (uploadingPhoto)
                  Positioned.fill(
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Colors.black26,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      ),
                    ),
                  ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: InkWell(
                    onTap: uploadingPhoto ? null : _pickAndUploadPhoto,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: Colors.teal,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.camera_alt_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Section: General Info
          const Text(
            'Thông tin cơ bản',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: AppColors.text),
          ),
          const SizedBox(height: 12),
          AppTextField(
            controller: name,
            label: 'Tên bé',
            icon: Icons.child_care_rounded,
            validator: (v) => Validators.required(v, 'Tên bé'),
          ),
          const SizedBox(height: 12),
          AppTextField(
            controller: age,
            label: 'Tuổi',
            icon: Icons.cake_rounded,
            keyboardType: TextInputType.number,
            validator: (v) =>
                int.tryParse(v ?? '') == null ? 'Tuổi chưa hợp lệ.' : null,
          ),
          const SizedBox(height: 16),
          _buildGenderSelector(),
          const SizedBox(height: 24),

          // Section: Development & Support
          const Text(
            'Phát triển & Hỗ trợ',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: AppColors.text),
          ),
          const SizedBox(height: 12),
          _buildDifficultySelector(),
          const SizedBox(height: 16),
          _buildSupportLevelSelector(),
          const SizedBox(height: 24),

          // Section: Goals & Learn mode
          _buildLearningGoals(),
          const SizedBox(height: 24),
          _buildCoLearningSelector(),
          const SizedBox(height: 24),
          
          // Section: Duration & Note
          const Text(
            'Thời lượng học & Ghi chú',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: AppColors.text),
          ),
          const SizedBox(height: 12),
          AppTextField(
            controller: dailyDuration,
            label: 'Thời lượng mỗi ngày (phút)',
            icon: Icons.timer_rounded,
            keyboardType: TextInputType.number,
            validator: (v) {
              final parsed = int.tryParse(v ?? '');
              if (parsed == null || parsed < 1) {
                return 'Thời lượng chưa hợp lệ.';
              }
              return null;
            },
          ),
          const SizedBox(height: 12),
          AppTextField(
            controller: note,
            label: 'Ghi chú cho phụ huynh',
            icon: Icons.notes_rounded,
            maxLines: 3,
          ),
          const SizedBox(height: 24),
          
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: AppColors.border, width: 1.5),
            ),
            color: Colors.white,
            elevation: 0,
            child: Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                title: const Text(
                  'Hồ sơ hỗ trợ AI',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: AppColors.text),
                ),
                subtitle: const Text(
                  'Thông tin này giúp AI chọn ví dụ, lời khen và cách gợi ý phù hợp hơn cho bé. Có thể để trống.',
                  style: TextStyle(fontSize: 12, color: AppColors.muted, fontWeight: FontWeight.normal),
                ),
                childrenPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                children: [
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Thông tin gọi tên',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 8),
                  AppTextField(
                    controller: nickname,
                    label: 'Biệt danh / Tên gọi ở nhà',
                    icon: Icons.face_rounded,
                  ),
                  const SizedBox(height: 16),
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Sở thích của bé',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 8),
                  AppTextField(
                    controller: favoriteColors,
                    label: 'Màu bé thích',
                    icon: Icons.color_lens_rounded,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: favoriteAnimals,
                    label: 'Con vật bé thích',
                    icon: Icons.pets_rounded,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: favoriteToys,
                    label: 'Đồ chơi bé thích',
                    icon: Icons.toys_rounded,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: favoriteSongs,
                    label: 'Bài hát bé thích',
                    icon: Icons.music_note_rounded,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: favoriteActivities,
                    label: 'Hoạt động bé thích',
                    icon: Icons.sports_esports_rounded,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: preferredPraise,
                    label: 'Cách khen bé thích',
                    icon: Icons.thumb_up_rounded,
                  ),
                  const SizedBox(height: 16),
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Gia đình',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 8),
                  AppTextField(
                    controller: primaryCaregiver,
                    label: 'Người chăm sóc chính',
                    icon: Icons.supervised_user_circle_rounded,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: familyMembers,
                    label: 'Thành viên gia đình',
                    icon: Icons.group_rounded,
                  ),
                  const SizedBox(height: 16),
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Giao tiếp & cảm xúc cơ bản',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: communicationLevel,
                    decoration: InputDecoration(
                      labelText: 'Mức độ giao tiếp của bé',
                      prefixIcon: const Icon(Icons.chat_bubble_rounded, color: AppColors.muted),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.border, width: 1.5),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.border, width: 1.5),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.primary, width: 2),
                      ),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'Chưa nói', child: Text('Chưa nói')),
                      DropdownMenuItem(value: 'Bập bẹ', child: Text('Bập bẹ')),
                      DropdownMenuItem(value: 'Từ đơn', child: Text('Từ đơn')),
                      DropdownMenuItem(value: 'Cụm từ ngắn', child: Text('Cụm từ ngắn')),
                      DropdownMenuItem(value: 'Câu ngắn', child: Text('Câu ngắn')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          communicationLevel = val;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: commonTriggers,
                    label: 'Điều làm bé khó chịu/sợ',
                    icon: Icons.warning_amber_rounded,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: calmingStrategies,
                    label: 'Cách giúp bé bình tĩnh',
                    icon: Icons.favorite_rounded,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          
          AppButton(
            label: 'Lưu hồ sơ',
            icon: Icons.check_rounded,
            loading: loading,
            onPressed: submit,
          ),
        ],
      ),
    ),
  );
}
