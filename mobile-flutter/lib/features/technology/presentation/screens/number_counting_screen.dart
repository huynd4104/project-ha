import 'package:flutter/material.dart';
import '../../../../core/services/nfc_service.dart';
import '../../../../core/services/tts_service.dart';
import '../../../lessons/widgets/nfc_tts_mixin.dart';
import '../../data/technology_repository.dart';

class NumberCountingScreen extends StatefulWidget {
  const NumberCountingScreen({super.key});

  @override
  State<NumberCountingScreen> createState() => _NumberCountingScreenState();
}

class _NumberCountingScreenState extends State<NumberCountingScreen> with NfcTtsMixin {
  final _repository = TechnologyRepository();
  List<Map<String, dynamic>> _questions = [];
  int _currentQuestionIndex = 0;
  bool _isLoading = true;
  bool _isAnswered = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final questions = await _repository.getNumberCountingQuestions();
      setState(() {
        _questions = questions;
        _isLoading = false;
      });
      if (questions.isNotEmpty) {
        _speakQuestion(questions[0]);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _speakQuestion(Map<String, dynamic> question) {
    TtsService.instance.speak(question['questionText']);
  }

  void _nextQuestion() {
    if (_currentQuestionIndex < _questions.length - 1) {
      setState(() {
        _currentQuestionIndex++;
        _isAnswered = false;
      });
      _speakQuestion(_questions[_currentQuestionIndex]);
    } else {
      showFeedback(true, 'Chúc mừng bé đã hoàn thành tất cả các câu hỏi!');
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) Navigator.pop(context);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Tập đếm')),
        body: const Center(child: Text('Chưa có câu hỏi nào.')),
      );
    }

    final question = _questions[_currentQuestionIndex];

    return Scaffold(
      appBar: AppBar(
        title: Text('Câu hỏi ${_currentQuestionIndex + 1}/${_questions.length}'),
        centerTitle: true,
        actions: [buildNfcStatusIcon()],
      ),
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.calculate_rounded, size: 80, color: Colors.blue),
            const SizedBox(height: 30),
            Text(
              question['questionText'],
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
            ),
            if (question['imageUrl'] != null && question['imageUrl'].isNotEmpty) ...[
              const SizedBox(height: 30),
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Image.network(
                  question['imageUrl'],
                  height: 200,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Icon(Icons.image_not_supported, size: 50, color: Colors.grey),
                ),
              ),
            ],
            const Spacer(),
            if (!_isAnswered)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.nfc_rounded, color: Colors.blue),
                    SizedBox(width: 12),
                    Text(
                      'Chạm thẻ số đáp án vào đây',
                      style: TextStyle(fontSize: 18, color: Colors.blue, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              )
            else
              ElevatedButton.icon(
                onPressed: _nextQuestion,
                icon: const Icon(Icons.arrow_forward),
                label: const Text('Câu tiếp theo'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
                  textStyle: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget buildNfcStatusIcon() {
    return StreamBuilder<NfcState>(
      stream: NfcService.instance.stateStream,
      initialData: NfcState.ready,
      builder: (context, snapshot) {
        final state = snapshot.data ?? NfcState.ready;
        IconData icon = Icons.nfc_rounded;
        Color color = Colors.grey;
        if (state == NfcState.ready) {
          icon = Icons.nfc_rounded;
          color = Colors.green;
        } else if (state == NfcState.reading) {
          icon = Icons.hourglass_empty_rounded;
          color = Colors.amber;
        } else if (state == NfcState.success) {
          icon = Icons.check_circle_rounded;
          color = Colors.blue;
        } else if (state == NfcState.error) {
          icon = Icons.error_outline_rounded;
          color = Colors.red;
        }
        return Padding(
          padding: const EdgeInsets.only(right: 16),
          child: Icon(icon, color: color),
        );
      },
    );
  }

  void showFeedback(bool correct, String message) {
    speakEvaluationFeedback(correct, customFeedback: message);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: correct ? Colors.green : Colors.red,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  void onNfcTagScanned(NfcResolvedTag tagData) {
    if (_isAnswered) return;

    final currentQuestion = _questions[_currentQuestionIndex];
    final correctVal = currentQuestion['numberValue'];

    if (tagData.tagType == 'NUMBER' && tagData.payloadValue != null) {
      final tagVal = int.tryParse(tagData.payloadValue!);
      if (tagVal == correctVal) {
        setState(() => _isAnswered = true);
        showFeedback(true, currentQuestion['successFeedback'] ?? 'Đúng rồi! Bé giỏi quá.');
      } else {
        showFeedback(false, currentQuestion['failureFeedback'] ?? 'Chưa đúng rồi, bé thử lại nhé.');
      }
    } else {
      if (tagData.spokenText != null) {
        TtsService.instance.speak(tagData.spokenText!);
      } else {
        showFeedback(false, 'Hãy dùng thẻ số để trả lời nhé.');
      }
    }
  }
}
