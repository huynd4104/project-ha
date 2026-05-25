import 'dart:math';
import 'dart:convert';
import 'dart:io' as io;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/services/sound_service.dart';
import '../../../core/utils/access_check.dart';
import '../../../core/utils/parent_gate.dart';
import '../../../core/config/app_config.dart';
import '../../parent_dashboard/screens/paywall_screen.dart';
import '../../learning_path/data/lesson_repository.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_image.dart';
import '../../../models/models.dart';
import '../widgets/audio_button.dart';
import '../widgets/microphone_button.dart';

typedef AnswerCallback = void Function(String selectedAnswer, String result, double score);

// 1. CHOICE_ANSWER Renderer (listenAndChooseImage, lookAndChooseWord, multipleChoice)
class ChoiceAnswerRenderer extends StatefulWidget {
  const ChoiceAnswerRenderer({
    super.key,
    required this.activity,
    required this.onAnswerSubmitted,
  });

  final Activity activity;
  final AnswerCallback onAnswerSubmitted;

  @override
  State<ChoiceAnswerRenderer> createState() => _ChoiceAnswerRendererState();
}

class _ChoiceAnswerRendererState extends State<ChoiceAnswerRenderer> {
  int? _selectedOptionIndex;
  bool _isAnswered = false;

  void _submit(ActivityOption option, int index) {
    // Prevent multiple submissions
    if (_isAnswered) return;

    setState(() {
      _selectedOptionIndex = index;
      _isAnswered = true;
    });

    final isCorrect = option.isCorrect || 
        widget.activity.correctAnswers.contains(option.id) ||
        widget.activity.correctAnswers.contains(option.text);

    final result = isCorrect ? 'correct' : 'wrong';
    final score = isCorrect ? 10.0 : 0.0;

    Future.delayed(const Duration(milliseconds: 300), () {
      widget.onAnswerSubmitted(option.text, result, score);
    });
  }

  @override
  Widget build(BuildContext context) {
    final activity = widget.activity;
    final hasImages = activity.options.any((o) => o.imageUrl != null && o.imageUrl!.isNotEmpty);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (activity.instruction.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Text(
              activity.instruction,
              style: AppTextStyles.muted.copyWith(fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
          ),
        Text(
          activity.prompt,
          style: AppTextStyles.headline.copyWith(fontSize: 20),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        if (activity.audioUrl != null && activity.audioUrl!.isNotEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: AudioButton(
                onPressed: () {
                  // Play audio
                },
                label: 'Nghe câu hỏi',
              ),
            ),
          ),
        if (activity.imageUrl != null && activity.imageUrl!.isNotEmpty)
          Container(
            height: 160,
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: AppImage(
                imageUrl: activity.imageUrl!,
                fit: BoxFit.contain,
              ),
            ),
          ),
        Expanded(
          child: hasImages
              ? GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 0.95,
                  ),
                  itemCount: activity.options.length,
                  itemBuilder: (context, idx) {
                    final option = activity.options[idx];
                    final isSelected = _selectedOptionIndex == idx;
                    return GestureDetector(
                      onTap: _isAnswered ? null : () => _submit(option, idx),
                      child: Opacity(
                        opacity: _isAnswered && !isSelected ? 0.5 : 1.0,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(AppRadius.lg),
                            border: Border.all(
                              color: isSelected ? AppColors.primary : Colors.grey[200]!,
                              width: isSelected ? 3.5 : 2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: isSelected 
                                    ? AppColors.primary.withOpacity(0.15) 
                                    : Colors.black.withOpacity(0.03),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              )
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Expanded(
                                child: ClipRRect(
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
                                  child: option.imageUrl != null && option.imageUrl!.isNotEmpty
                                      ? AppImage(imageUrl: option.imageUrl!, fit: BoxFit.cover)
                                      : const Icon(Icons.image_outlined, size: 48, color: Colors.grey),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 10.0),
                                child: Text(
                                  option.text,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 16,
                                    color: AppColors.text,
                                  ),
                                  textAlign: TextAlign.center,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                )
              : ListView.builder(
                  itemCount: activity.options.length,
                  itemBuilder: (context, idx) {
                    final option = activity.options[idx];
                    final isSelected = _selectedOptionIndex == idx;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 14.0),
                      child: Opacity(
                        opacity: _isAnswered && !isSelected ? 0.5 : 1.0,
                        child: AppCard(
                          borderColor: isSelected ? AppColors.primary : Colors.grey[200]!,
                          color: isSelected ? AppColors.cream : Colors.white,
                          onTap: _isAnswered ? null : () => _submit(option, idx),
                          child: Center(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8.0),
                              child: Text(
                                option.text,
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: isSelected ? AppColors.primary : AppColors.text,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

// 2. TEXT_ANSWER Renderer
class TextAnswerRenderer extends StatefulWidget {
  const TextAnswerRenderer({
    super.key,
    required this.activity,
    required this.onAnswerSubmitted,
  });

  final Activity activity;
  final AnswerCallback onAnswerSubmitted;

  @override
  State<TextAnswerRenderer> createState() => _TextAnswerRendererState();
}

class _TextAnswerRendererState extends State<TextAnswerRenderer> {
  final _controller = TextEditingController();

  void _submit() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    final lowerText = text.toLowerCase();
    
    // Check match in correct answers
    bool isCorrect = false;
    for (final ans in widget.activity.correctAnswers) {
      if (ans.toLowerCase() == lowerText) {
        isCorrect = true;
        break;
      }
    }

    bool isAlmost = false;
    for (final ans in widget.activity.almostAnswers) {
      if (ans.toLowerCase() == lowerText) {
        isAlmost = true;
        break;
      }
    }

    final result = isCorrect 
        ? 'correct' 
        : (isAlmost ? 'almost' : 'wrong');
    final score = isCorrect 
        ? 10.0 
        : (isAlmost ? 5.0 : 0.0);

    widget.onAnswerSubmitted(text, result, score);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final activity = widget.activity;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (activity.instruction.isNotEmpty)
            Text(
              activity.instruction,
              style: AppTextStyles.muted.copyWith(fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
          const SizedBox(height: 8),
          Text(
            activity.prompt,
            style: AppTextStyles.headline.copyWith(fontSize: 20),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          if (activity.imageUrl != null && activity.imageUrl!.isNotEmpty)
            Container(
              height: 180,
              margin: const EdgeInsets.only(bottom: 20),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: AppImage(imageUrl: activity.imageUrl!, fit: BoxFit.contain),
              ),
            ),
          TextField(
            controller: _controller,
            decoration: InputDecoration(
              hintText: 'Nhập câu trả lời của con...',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Colors.grey),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.sky, width: 2),
              ),
            ),
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: 24),
          AppButton(
            label: 'Gửi câu trả lời',
            icon: Icons.send_rounded,
            onPressed: _submit,
          ),
        ],
      ),
    );
  }
}

// 3. SPELLING Renderer
class SpellingRenderer extends StatefulWidget {
  const SpellingRenderer({
    super.key,
    required this.activity,
    required this.onAnswerSubmitted,
  });

  final Activity activity;
  final AnswerCallback onAnswerSubmitted;

  @override
  State<SpellingRenderer> createState() => _SpellingRendererState();
}

class _SpellingRendererState extends State<SpellingRenderer> {
  late String _correctWord;
  List<String> _letterPool = [];
  final List<String> _assembledLetters = [];

  @override
  void initState() {
    super.initState();
    _initSpelling();
  }

  void _initSpelling() {
    _correctWord = widget.activity.correctAnswers.isNotEmpty
        ? widget.activity.correctAnswers.first.toUpperCase()
        : 'HELLO';
    
    // Split and shuffle
    _letterPool = _correctWord.split('').toList()..shuffle(Random());
    _assembledLetters.clear();
  }

  void _selectLetter(int idx, String letter) {
    setState(() {
      _assembledLetters.add(letter);
      _letterPool.removeAt(idx);
    });

    // Check if fully assembled
    if (_letterPool.isEmpty) {
      final currentWord = _assembledLetters.join('');
      final isCorrect = currentWord == _correctWord;
      
      Future.delayed(const Duration(milliseconds: 350), () {
        widget.onAnswerSubmitted(
          currentWord, 
          isCorrect ? 'correct' : 'wrong', 
          isCorrect ? 10.0 : 0.0,
        );
      });
    }
  }

  void _removeLastLetter() {
    if (_assembledLetters.isEmpty) return;
    setState(() {
      final last = _assembledLetters.removeLast();
      _letterPool.add(last);
    });
  }

  @override
  Widget build(BuildContext context) {
    final activity = widget.activity;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          activity.instruction.isNotEmpty ? activity.instruction : 'Sắp xếp chữ cái để tạo từ đúng:',
          style: AppTextStyles.muted.copyWith(fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          activity.prompt,
          style: AppTextStyles.headline.copyWith(fontSize: 20),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 20),
        if (activity.imageUrl != null && activity.imageUrl!.isNotEmpty)
          Container(
            height: 140,
            margin: const EdgeInsets.only(bottom: 16),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: AppImage(imageUrl: activity.imageUrl!, fit: BoxFit.contain),
            ),
          ),
        
        // Target slots
        Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ...List.generate(_correctWord.length, (idx) {
                final hasLetter = idx < _assembledLetters.length;
                return Container(
                  width: 42,
                  height: 42,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: hasLetter ? AppColors.sky : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: hasLetter ? AppColors.sky : Colors.grey[300]!,
                      width: 1.5,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      hasLetter ? _assembledLetters[idx] : '',
                      style: const TextStyle(
                        fontSize: 20, 
                        fontWeight: FontWeight.bold, 
                        color: Colors.white,
                      ),
                    ),
                  ),
                );
              }),
              if (_assembledLetters.isNotEmpty) ...[
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _removeLastLetter,
                  icon: const Icon(Icons.backspace_rounded, color: AppColors.coral),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Letter pool
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 12,
          runSpacing: 12,
          children: List.generate(_letterPool.length, (idx) {
            final letter = _letterPool[idx];
            return GestureDetector(
              onTap: () => _selectLetter(idx, letter),
              child: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    )
                  ],
                ),
                child: Center(
                  child: Text(
                    letter,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.text),
                  ),
                ),
              ),
            );
          }),
        ),
        const Spacer(),
        if (_assembledLetters.isNotEmpty)
          AppButton(
            label: 'Làm lại',
            icon: Icons.refresh_rounded,
            variant: AppButtonVariant.secondary,
            onPressed: () {
              setState(() {
                _initSpelling();
              });
            },
          ),
      ],
    );
  }
}

// 4. DRAG_DROP (Match/Fill gaps) Renderer
class DragDropRenderer extends StatefulWidget {
  const DragDropRenderer({
    super.key,
    required this.activity,
    required this.onAnswerSubmitted,
  });

  final Activity activity;
  final AnswerCallback onAnswerSubmitted;

  @override
  State<DragDropRenderer> createState() => _DragDropRendererState();
}

class _DragDropRendererState extends State<DragDropRenderer> {
  String? _selectedText;

  void _selectWord(String word) {
    setState(() {
      _selectedText = word;
    });
  }

  void _submit() {
    if (_selectedText == null) return;

    final isCorrect = widget.activity.correctAnswers.contains(_selectedText);
    widget.onAnswerSubmitted(
      _selectedText!, 
      isCorrect ? 'correct' : 'wrong', 
      isCorrect ? 10.0 : 0.0,
    );
  }

  @override
  Widget build(BuildContext context) {
    final activity = widget.activity;
    
    // Display prompt with slot
    // e.g. "Con mèo kêu ____" -> replace placeholder with text or highlight
    final displayText = activity.prompt.replaceAll('____', ' [ ? ] ');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          activity.instruction.isNotEmpty ? activity.instruction : 'Chọn từ đúng điền vào chỗ trống:',
          style: AppTextStyles.muted.copyWith(fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Column(
            children: [
              if (activity.imageUrl != null && activity.imageUrl!.isNotEmpty) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: AppImage(imageUrl: activity.imageUrl!, height: 120, fit: BoxFit.contain),
                ),
                const SizedBox(height: 16),
              ],
              Text(
                _selectedText != null
                    ? activity.prompt.replaceAll('____', ' [ $_selectedText ] ')
                    : displayText,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, height: 1.5),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        const Text(
          'Từ gợi ý:',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 12,
          runSpacing: 12,
          children: activity.options.map((opt) {
            final isSelected = _selectedText == opt.text;
            return GestureDetector(
              onTap: () => _selectWord(opt.text),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.sky : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected ? AppColors.sky : Colors.grey[300]!,
                    width: 2,
                  ),
                ),
                child: Text(
                  opt.text,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.white : AppColors.text,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const Spacer(),
        AppButton(
          label: 'Gửi câu trả lời',
          icon: Icons.check_circle_rounded,
          onPressed: _selectedText == null ? null : _submit,
        ),
      ],
    );
  }
}

// 5. FLASHCARD Renderer
class FlashcardRenderer extends StatefulWidget {
  const FlashcardRenderer({
    super.key,
    required this.activity,
    required this.onAnswerSubmitted,
  });

  final Activity activity;
  final AnswerCallback onAnswerSubmitted;

  @override
  State<FlashcardRenderer> createState() => _FlashcardRendererState();
}

class _FlashcardRendererState extends State<FlashcardRenderer> {
  bool _showBack = false;

  void _flipCard() {
    setState(() {
      _showBack = !_showBack;
    });
  }

  void _submit() {
    widget.onAnswerSubmitted('viewed', 'done', 10.0);
  }

  @override
  Widget build(BuildContext context) {
    final activity = widget.activity;
    
    // Front and back contents
    final frontText = activity.prompt;
    // Lấy back text từ correctAnswers hoặc options
    final backText = activity.correctAnswers.isNotEmpty
        ? activity.correctAnswers.first
        : (activity.options.isNotEmpty ? activity.options.first.text : 'Nghĩa của từ');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          activity.instruction.isNotEmpty ? activity.instruction : 'Chạm vào thẻ để lật xem ý nghĩa:',
          style: AppTextStyles.muted.copyWith(fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        Expanded(
          child: Center(
            child: GestureDetector(
              onTap: _flipCard,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 260,
                height: 360,
                decoration: BoxDecoration(
                  color: _showBack ? const Color(0xFFF0FDF4) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: _showBack ? const Color(0xFF86EFAC) : AppColors.sky.withOpacity(0.5),
                    width: 3,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    )
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (!_showBack) ...[
                        if (activity.imageUrl != null && activity.imageUrl!.isNotEmpty) ...[
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: AppImage(imageUrl: activity.imageUrl!, fit: BoxFit.contain),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                        Text(
                          frontText,
                          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.text),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Icon(Icons.touch_app_rounded, color: Colors.grey[400], size: 24),
                      ] else ...[
                        const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 48),
                        const SizedBox(height: 20),
                        Text(
                          backText,
                          style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Color(0xFF166534)),
                          textAlign: TextAlign.center,
                        ),
                        if (activity.parentInstruction.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          Text(
                            activity.parentInstruction,
                            style: TextStyle(fontSize: 13, color: Colors.grey[600], fontStyle: FontStyle.italic),
                            textAlign: TextAlign.center,
                          ),
                        ]
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 32),
        if (activity.audioUrl != null && activity.audioUrl!.isNotEmpty)
          Center(
            child: AudioButton(
              onPressed: () {
                // Play card pronunciation
              },
              label: 'Phát âm',
            ),
          ),
        const SizedBox(height: 20),
        AppButton(
          label: 'Đã thuộc thẻ',
          icon: Icons.check_rounded,
          onPressed: _submit,
        ),
      ],
    );
  }
}

// 6. DIALOGUE_ROLEPLAY (hearAndRepeat, scenario) Renderer
class DialogueRoleplayRenderer extends StatefulWidget {
  const DialogueRoleplayRenderer({
    super.key,
    required this.activity,
    required this.onAnswerSubmitted,
  });

  final Activity activity;
  final AnswerCallback onAnswerSubmitted;

  @override
  State<DialogueRoleplayRenderer> createState() => _DialogueRoleplayRendererState();
}

class _DialogueRoleplayRendererState extends State<DialogueRoleplayRenderer> {
  bool _isListening = false;

  void _startListening() {
    setState(() => _isListening = true);
    // Simulate speech recognition stop after 2 seconds
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _isListening = false);
        _submit();
      }
    });
  }

  void _submit() {
    widget.onAnswerSubmitted('roleplay', 'done', 10.0);
  }

  @override
  Widget build(BuildContext context) {
    final activity = widget.activity;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          activity.instruction.isNotEmpty ? activity.instruction : 'Nghe và lặp lại đoạn hội thoại sau:',
          style: AppTextStyles.muted.copyWith(fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        
        // Chat dialogue bubbles
        Expanded(
          child: ListView(
            children: [
              // Character 1 (NPC)
              Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(right: 40, bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(16),
                      topRight: Radius.circular(16),
                      bottomRight: Radius.circular(16),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Bạn đồng hành:',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey),
                      ),
                      const SizedBox(height: 4),
                      Text(activity.prompt, style: const TextStyle(fontSize: 16)),
                    ],
                  ),
                ),
              ),

              // Character 2 (Child Target)
              if (activity.options.isNotEmpty)
                Align(
                  alignment: Alignment.centerRight,
                  child: Container(
                    margin: const EdgeInsets.only(left: 40, bottom: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: Color(0xFFE0F2FE),
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                        bottomLeft: Radius.circular(16),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Con nói:',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.sky),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          activity.options.first.text,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF0369A1)),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
        
        if (activity.audioUrl != null && activity.audioUrl!.isNotEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: AudioButton(
                onPressed: () {},
                label: 'Nghe mẫu',
              ),
            ),
          ),
        
        Center(
          child: Column(
            children: [
              MicrophoneButton(
                active: _isListening,
                onPressed: _startListening,
              ),
              const SizedBox(height: 8),
              Text(
                _isListening ? 'Đang lắng nghe con nói...' : 'Nhấn vào micro để lặp lại',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: _isListening ? AppColors.coral : Colors.grey,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

// 7. VOICE_ANSWER Renderer (AI Voice Quiz Placeholder)
enum VoiceState {
  idle,
  requestingPermission,
  recording,
  uploading,
  correct,
  almost,
  wrong,
  error,
  noSpeech,
}

class VoiceAnswerRenderer extends StatefulWidget {
  const VoiceAnswerRenderer({
    super.key,
    required this.activity,
    required this.onAnswerSubmitted,
  });

  final Activity activity;
  final AnswerCallback onAnswerSubmitted;

  @override
  State<VoiceAnswerRenderer> createState() => _VoiceAnswerRendererState();
}

class _VoiceAnswerRendererState extends State<VoiceAnswerRenderer> {
  final AudioRecorder _recorder = AudioRecorder();
  VoiceState _state = VoiceState.idle;
  String _transcript = '';
  String _feedback = '';
  int _retriesUsed = 0;
  String? _tempPath;
  DateTime? _recordingStart;
  String? _errorMessage;
  String _quickMockText = '';

  @override
  void initState() {
    super.initState();
    _playPrompt();
  }

  @override
  void dispose() {
    _recorder.dispose();
    super.dispose();
  }

  void _playPrompt() {
    if (widget.activity.audioUrl != null && widget.activity.audioUrl!.isNotEmpty) {
      SoundService.instance.playUrl(widget.activity.audioUrl);
    }
  }

  Future<void> _startRecording() async {
    setState(() {
      _state = VoiceState.requestingPermission;
      _errorMessage = null;
    });

    try {
      if (await _recorder.hasPermission()) {
        String? path;
        if (!kIsWeb) {
          final dir = await getTemporaryDirectory();
          path = '${dir.path}/voice_temp_${DateTime.now().millisecondsSinceEpoch}.m4a';
        }
        _tempPath = path;

        await _recorder.start(
          const RecordConfig(encoder: AudioEncoder.aacLc),
          path: path ?? '',
        );

        _recordingStart = DateTime.now();
        setState(() {
          _state = VoiceState.recording;
        });

        // Automatically stop recording after 5 seconds
        Future.delayed(const Duration(seconds: 5), () {
          if (mounted && _state == VoiceState.recording) {
            _stopAndUpload();
          }
        });
      } else {
        setState(() {
          _state = VoiceState.error;
          _errorMessage = kIsWeb 
              ? 'Trình duyệt hiện không hỗ trợ ghi âm. Vui lòng dùng thiết bị di động hoặc cấp quyền micro.'
              : 'Micro chưa được bật. Phụ huynh hãy cấp quyền micro giúp con.';
        });
      }
    } catch (e) {
      setState(() {
        _state = VoiceState.error;
        _errorMessage = kIsWeb
            ? 'Trình duyệt hiện không hỗ trợ ghi âm. Vui lòng dùng thiết bị di động hoặc cấp quyền micro.\nChi tiết: $e'
            : 'Lỗi khởi động ghi âm: $e';
      });
    }
  }

  Future<String> _getAudioBase64(String path) async {
    if (kIsWeb) {
      final response = await http.get(Uri.parse(path));
      return base64Encode(response.bodyBytes);
    } else {
      final file = io.File(path);
      final bytes = await file.readAsBytes();
      return base64Encode(bytes);
    }
  }

  Future<void> _stopAndUpload({String? manualMockText}) async {
    String? audioPath;
    int durationSec = 3;

    if (manualMockText == null) {
      if (_state != VoiceState.recording) return;
      audioPath = await _recorder.stop();
      if (audioPath == null) {
        setState(() {
          _state = VoiceState.error;
          _errorMessage = 'Không thu được âm thanh.';
        });
        return;
      }
      if (_recordingStart != null) {
        durationSec = DateTime.now().difference(_recordingStart!).inSeconds;
        if (durationSec < 1) durationSec = 1;
        if (durationSec > 5) durationSec = 5;
      }
    }

    setState(() {
      _state = VoiceState.uploading;
      _errorMessage = null;
    });

    try {
      String? audioBase64;
      if (audioPath != null) {
        audioBase64 = await _getAudioBase64(audioPath);
      }

      final state = context.read<AppState>();
      final resData = await LessonRepository().submitVoiceAnswer(
        childId: state.activeChild?.id ?? '',
        lessonId: widget.activity.lessonId,
        activityId: widget.activity.id,
        audioBase64: audioBase64,
        durationSec: durationSec,
        mockTranscript: manualMockText,
      );

      final transcript = resData['transcript'] ?? '';
      final resStatus = resData['result'] ?? 'WRONG';
      final feedbackText = resData['feedbackText'] ?? '';

      if (resStatus == 'NO_SPEECH_DETECTED') {
        setState(() {
          _transcript = '';
          _feedback = feedbackText;
          _state = VoiceState.noSpeech;
        });
        return;
      }

      setState(() {
        _transcript = transcript;
        _feedback = feedbackText;
        if (resStatus == 'CORRECT') {
          _state = VoiceState.correct;
        } else if (resStatus == 'ALMOST') {
          _state = VoiceState.almost;
        } else {
          _state = VoiceState.wrong;
        }
      });

      final isCorrect = resStatus == 'CORRECT';
      final isAlmost = resStatus == 'ALMOST';

      if (isCorrect) {
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            widget.onAnswerSubmitted(transcript, 'correct', 10.0);
          }
        });
      } else if (isAlmost) {
        _retriesUsed++;
        final maxRetries = widget.activity.retryLimit;
        if (_retriesUsed > maxRetries) {
          Future.delayed(const Duration(seconds: 3), () {
            if (mounted) {
              widget.onAnswerSubmitted(transcript, 'almost', 5.0);
            }
          });
        }
      } else {
        _retriesUsed++;
        final maxRetries = widget.activity.retryLimit;
        if (_retriesUsed > maxRetries) {
          Future.delayed(const Duration(seconds: 3), () {
            if (mounted) {
              widget.onAnswerSubmitted(transcript, 'wrong', 0.0);
            }
          });
        }
      }
    } catch (e) {
      setState(() {
        _state = VoiceState.error;
        _errorMessage = 'Mình chưa nghe rõ, con thử lại nhé.\nChi tiết: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final activity = widget.activity;
    final state = context.watch<AppState>();

    final hasPremiumAccess = AccessCheck.canAccessContent(
      accessType: AccessType.premium,
      summary: state.appUser?.subscriptionSummary,
      entitlementType: 'voiceQuiz',
    );

    final bool isPremiumLocked = !hasPremiumAccess;

    if (isPremiumLocked) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.amber.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.amber.shade200),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.workspace_premium_rounded, size: 50, color: Colors.amber),
            const SizedBox(height: 12),
            const Text(
              'Tính Năng Premium',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.amber),
            ),
            const SizedBox(height: 8),
            const Text(
              'Hoạt động đàm thoại bằng giọng nói là tính năng Premium dành riêng cho trẻ. Phụ huynh hãy mở khóa để con được học nhé!',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.amber),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                ParentGate.show(context, () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => const PaywallScreen(),
                    ),
                  );
                });
              },
              child: const Text('Dành cho Bố Mẹ'),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          activity.instruction.isNotEmpty ? activity.instruction : 'Nói câu trả lời của con vào micro:',
          style: AppTextStyles.muted.copyWith(fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        if (kDebugMode || AppConfig.enableDemoPremiumUpgrade)
          Padding(
            padding: const EdgeInsets.only(top: 4, bottom: 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                '🎙️ CHẾ ĐỘ MOCK DEMO (Phát âm được giả lập qua text nhập dưới)',
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.blue,
                  fontWeight: FontWeight.w900,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        const SizedBox(height: 8),
        Text(
          activity.prompt,
          style: AppTextStyles.headline.copyWith(fontSize: 20),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        if (activity.ttsPromptText != null && activity.ttsPromptText!.isNotEmpty) ...[
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.volume_up, size: 16, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(
                  '"${activity.ttsPromptText}"',
                  style: const TextStyle(fontSize: 14, fontStyle: FontStyle.italic, color: AppColors.muted),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Audio playing cue
        if (activity.audioUrl != null && activity.audioUrl!.isNotEmpty) ...[
          Center(
            child: AudioButton(
              onPressed: _playPrompt,
              label: 'Nghe câu hỏi',
            ),
          ),
          const SizedBox(height: 16),
        ],

        // States display
        if (_state == VoiceState.uploading)
          const Center(
            child: Column(
              children: [
                SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: AppColors.primary)),
                SizedBox(height: 12),
                Text(
                  'Mimi đang lắng nghe con nói...',
                  style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.muted),
                ),
              ],
            ),
          )
        else if (_state == VoiceState.correct)
          Center(
            child: Column(
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 56),
                const SizedBox(height: 8),
                Text(_feedback, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green, fontSize: 16)),
                if (_transcript.isNotEmpty) Text('Mimi nghe được: "$_transcript"', style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic)),
              ],
            ),
          )
        else if (_state == VoiceState.almost)
          Center(
            child: Column(
              children: [
                const Icon(Icons.star_half, color: Colors.orange, size: 56),
                const SizedBox(height: 8),
                Text(_feedback, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.orange, fontSize: 16)),
                if (_transcript.isNotEmpty) Text('Mimi nghe được: "$_transcript"', style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic)),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _startRecording,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.orange,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('Thử lại nhé', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          )
        else if (_state == VoiceState.wrong)
          Center(
            child: Column(
              children: [
                const Icon(Icons.cancel, color: Colors.red, size: 56),
                const SizedBox(height: 8),
                Text(_feedback, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 16)),
                if (_transcript.isNotEmpty) Text('Mimi nghe được: "$_transcript"', style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic)),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _startRecording,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('Thử lại nhé', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          )
        else if (_state == VoiceState.error)
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  const Icon(Icons.error_outline, color: Colors.redAccent, size: 48),
                  const SizedBox(height: 8),
                  Text(_errorMessage ?? 'Lỗi không xác định', style: const TextStyle(color: Colors.redAccent), textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _startRecording,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[700],
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('Thử lại', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          )
        else if (_state == VoiceState.noSpeech)
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.orange.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.mic_off_rounded, color: AppColors.orange, size: 56),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _feedback.isNotEmpty ? _feedback : 'Mimi chưa nghe rõ con nói gì, con hãy nói to hơn một chút nhé!',
                    style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.orange, fontSize: 15),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _startRecording,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.orange,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      elevation: 2,
                    ),
                    child: const Text(
                      'Bé nói lại nhé!',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                    ),
                  ),
                ],
              ),
            ),
          ),

        const Spacer(),
        if (_state == VoiceState.idle || _state == VoiceState.recording)
          Center(
            child: Column(
              children: [
                MicrophoneButton(
                  active: _state == VoiceState.recording,
                  onPressed: _state == VoiceState.recording ? _stopAndUpload : _startRecording,
                ),
                const SizedBox(height: 12),
                Text(
                  _state == VoiceState.recording ? 'Đang ghi âm... Chạm lại để dừng.' : 'Chạm micro để phát biểu',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: _state == VoiceState.recording ? AppColors.coral : Colors.grey[600],
                  ),
                ),
                if (widget.activity.retryLimit > 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 4.0),
                    child: Text(
                      'Lượt làm lại: $_retriesUsed / ${widget.activity.retryLimit}',
                      style: const TextStyle(fontSize: 12, color: AppColors.muted),
                    ),
                  ),
              ],
            ),
          ),
        const Spacer(),

        // Manual Mock Transcription in Debug / Demo mode
        if (kDebugMode || AppConfig.enableDemoPremiumUpgrade) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  '🛠️ MOCK PROVIDER DEV MODE',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Colors.blueAccent,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: const InputDecoration(
                          hintText: 'Nhập text mock (ví dụ: xin chào)',
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (val) {
                          setState(() {
                            _quickMockText = val;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () => _stopAndUpload(manualMockText: _quickMockText),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      child: const Text('Gửi Mock'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

// 8. PARENT_MARK Renderer
class ParentMarkRenderer extends StatelessWidget {
  const ParentMarkRenderer({
    super.key,
    required this.activity,
    required this.onAnswerSubmitted,
  });

  final Activity activity;
  final AnswerCallback onAnswerSubmitted;

  void _mark(String grade, String result, double score) {
    onAnswerSubmitted(grade, result, score);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Dành cho Phụ Huynh:',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 6),
        Text(
          activity.parentInstruction.isNotEmpty
              ? activity.parentInstruction
              : 'Hãy quan sát bé thực hiện hành động dưới đây và chấm điểm cho bé:',
          style: AppTextStyles.body.copyWith(fontStyle: FontStyle.italic),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 20),
        
        // Task to do
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 10,
              )
            ],
          ),
          child: Column(
            children: [
              if (activity.imageUrl != null && activity.imageUrl!.isNotEmpty) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: AppImage(imageUrl: activity.imageUrl!, height: 140, fit: BoxFit.contain),
                ),
                const SizedBox(height: 16),
              ],
              Text(
                activity.prompt,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
        
        const Spacer(),
        const Text(
          'Kết quả thực hiện của con:',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        
        // Mark buttons
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => _mark('tốt', 'done', 10.0),
                child: _GradeCard(
                  color: const Color(0xFF10B981),
                  icon: Icons.star_rounded,
                  label: 'Làm tốt',
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: GestureDetector(
                onTap: () => _mark('khá', 'partial', 5.0),
                child: _GradeCard(
                  color: Colors.amber[700]!,
                  icon: Icons.star_half_rounded,
                  label: 'Gần đúng',
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: GestureDetector(
                onTap: () => _mark('chưa', 'not_yet', 0.0),
                child: _GradeCard(
                  color: AppColors.coral,
                  icon: Icons.refresh_rounded,
                  label: 'Thử lại sau',
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _GradeCard extends StatelessWidget {
  const _GradeCard({
    required this.color,
    required this.icon,
    required this.label,
  });

  final Color color;
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3), width: 1.5),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 36),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 13,
              color: color,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
