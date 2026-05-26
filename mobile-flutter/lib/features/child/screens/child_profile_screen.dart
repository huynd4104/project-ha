import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;

import '../../../core/services/app_state.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../models/models.dart';
import '../../../core/api/api_client.dart';

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
  bool uploadingPhoto = false;

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
    }
  }

  @override
  void dispose() {
    name.dispose();
    age.dispose();
    dailyDuration.dispose();
    note.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadPhoto() async {
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

    setState(() => uploadingPhoto = true);

    try {
      final fileBytes = await image.readAsBytes();
      final fileName = image.name;
      final contentType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
      final sizeBytes = fileBytes.length;

      // 1. Request presigned upload URL
      final presignRes = await ApiClient.instance.post('/api/media/presign-upload', {
        'fileName': fileName,
        'contentType': contentType,
        'sizeBytes': sizeBytes,
      }) as Map<String, dynamic>;

      final uploadUrl = presignRes['uploadUrl'] as String?;
      final mediaFile = presignRes['mediaFile'] as Map?;
      
      if (uploadUrl == null || uploadUrl.isEmpty || mediaFile == null) {
        throw Exception('Không nhận được URL upload từ server.');
      }

      // 2. Upload to Cloudflare R2
      final Map<String, String> uploadHeaders = {};
      if (presignRes['headers'] != null) {
        (presignRes['headers'] as Map).forEach((k, v) {
          uploadHeaders[k.toString()] = v.toString();
        });
      } else {
        uploadHeaders['Content-Type'] = contentType;
      }

      final uploadResponse = await http.put(
        Uri.parse(uploadUrl),
        headers: uploadHeaders,
        body: fileBytes,
      );

      if (uploadResponse.statusCode < 200 || uploadResponse.statusCode >= 300) {
        throw Exception(
            'Tải ảnh lên R2 thất bại: ${uploadResponse.statusCode} - ${uploadResponse.body}');
      }

      // 3. Complete upload
      final completeRes = await ApiClient.instance.post('/api/media/complete-upload', {
        'mediaFileId': mediaFile['id'],
        'metadata': {
          'originalName': fileName,
          'sizeBytes': sizeBytes,
        }
      }) as Map<String, dynamic>;

      final publicUrl = completeRes['publicUrl'] as String?;
      if (publicUrl == null || publicUrl.isEmpty) {
        throw Exception('Không nhận được URL công khai.');
      }

      setState(() {
        avatarUrl = publicUrl;
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
    if (child == null) {
      await state.childRepository.create(
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
        avatarUrl: avatarUrl,
      );
    } else {
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
        ),
      );
    }
    await state.refresh();
    if (mounted) context.go('/home');
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Hồ sơ của bé'),
      leading: (Navigator.canPop(context) || context.read<AppState>().hasChild)
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              onPressed: () {
                if (Navigator.canPop(context)) {
                  Navigator.of(context).pop();
                } else {
                  context.go('/profile');
                }
              },
            )
          : null,
      actions: [
        TextButton(
          onPressed: () => context.read<AppState>().logout(),
          child: const Text('Đăng xuất'),
        ),
      ],
    ),
    body: Form(
      key: formKey,
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text(
            'Tạo hồ sơ để cá nhân hóa lộ trình học.',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 18),
          Center(
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 54,
                  backgroundColor: Colors.grey.shade200,
                  backgroundImage: avatarUrl != null && avatarUrl!.isNotEmpty
                      ? NetworkImage(avatarUrl!)
                      : null,
                  child: avatarUrl == null || avatarUrl!.isEmpty
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
          const SizedBox(height: 18),
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
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: gender,
            items: const [
              'Không ghi',
              'Nam',
              'Nữ',
            ].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
            onChanged: (v) => setState(() => gender = v ?? gender),
            decoration: const InputDecoration(labelText: 'Giới tính'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<DevelopmentCategoryKey>(
            value: primaryDifficulty,
            items: DevelopmentCategoryKey.values
                .map(
                  (value) =>
                      DropdownMenuItem(value: value, child: Text(value.label)),
                )
                .toList(),
            onChanged: (v) =>
                setState(() => primaryDifficulty = v ?? primaryDifficulty),
            decoration: const InputDecoration(labelText: 'Khó khăn chính'),
          ),
          const SizedBox(height: 12),
          Text(
            'Mục tiêu học tập',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: LearningGoalKey.values.map((goal) {
              final selected = learningGoals.contains(goal);
              return FilterChip(
                label: Text(goal.label),
                selected: selected,
                onSelected: (value) {
                  setState(() {
                    if (value) {
                      learningGoals.add(goal);
                    } else {
                      learningGoals.remove(goal);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<SupportLevel>(
            value: supportLevel,
            items: SupportLevel.values
                .map(
                  (value) =>
                      DropdownMenuItem(value: value, child: Text(value.label)),
                )
                .toList(),
            onChanged: (v) => setState(() => supportLevel = v ?? supportLevel),
            decoration: const InputDecoration(labelText: 'Mức hỗ trợ'),
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
          DropdownButtonFormField<CoLearningMode>(
            value: coLearningMode,
            items: CoLearningMode.values
                .map(
                  (value) =>
                      DropdownMenuItem(value: value, child: Text(value.label)),
                )
                .toList(),
            onChanged: (v) =>
                setState(() => coLearningMode = v ?? coLearningMode),
            decoration: const InputDecoration(labelText: 'Cách học cùng bé'),
          ),
          const SizedBox(height: 12),
          AppTextField(
            controller: note,
            label: 'Ghi chú cho phụ huynh',
            icon: Icons.notes_rounded,
            maxLines: 3,
          ),
          const SizedBox(height: 18),
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
