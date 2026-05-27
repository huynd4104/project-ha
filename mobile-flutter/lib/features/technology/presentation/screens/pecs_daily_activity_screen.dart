import 'package:flutter/material.dart';
import '../../../../core/services/nfc_service.dart';
import '../../../../core/services/tts_service.dart';
import '../../../../core/utils/nfc_value_normalizer.dart';
import '../../../lessons/widgets/nfc_tts_mixin.dart';
import '../../data/technology_repository.dart';

class PecsDailyActivityScreen extends StatefulWidget {
  const PecsDailyActivityScreen({super.key});

  @override
  State<PecsDailyActivityScreen> createState() => _PecsDailyActivityScreenState();
}

class _PecsDailyActivityScreenState extends State<PecsDailyActivityScreen> with NfcTtsMixin {
  final _repository = TechnologyRepository();
  List<Map<String, dynamic>> _items = [];
  Map<String, dynamic>? _selectedCard;
  bool _isLoading = true;

  final String _openingQuestion = 'Hôm nay bạn đã làm gì?';

  @override
  void initState() {
    super.initState();
    _loadData();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _speakOpening();
    });
  }

  Future<void> _loadData() async {
    try {
      final items = await _repository.getPecsCards(category: 'DAILY_ACTIVITY');
      setState(() {
        _items = items;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải dữ liệu PECS: $e')),
        );
      }
    }
  }

  void _speakOpening() {
    TtsService.instance.speak(_openingQuestion);
  }

  void _onCardSelected(Map<String, dynamic> card) {
    setState(() => _selectedCard = card);
    final text = card['spokenText'] ?? card['title'] ?? '';
    TtsService.instance.speak(text);
  }

  Map<String, dynamic>? _resolvePecsCard(NfcResolvedTag tag) {
    // 1. Match by nfcTagId (metadata tagId)
    final tagId = tag.metadata['tagId']?.toString();
    if (tagId != null && tagId.isNotEmpty) {
      for (final card in _items) {
        if (card['nfcTagId']?.toString() == tagId) {
          return card;
        }
      }
    }

    // 2. Match by linked source id from the new NFC workflow
    final targetId = tag.targetId;
    if (targetId != null && targetId.isNotEmpty) {
      for (final card in _items) {
        if (card['id']?.toString() == targetId) {
          return card;
        }
      }
    }

    // 3. Match by stable payloadValue or normalized title/category
    final payload = tag.payloadValue;
    if (payload != null && payload.isNotEmpty) {
      for (final card in _items) {
        final title = card['title']?.toString() ?? '';
        final category = card['category']?.toString() ?? '';
        if (nfcValuesMatch(payload, title) ||
            nfcValuesMatch(payload, '${category}_$title') ||
            nfcValuesMatch(payload, category)) {
          return card;
        }
      }
    }

    return null;
  }

  @override
  void onNfcTagScanned(NfcResolvedTag tag) {
    if (tag.tagType != 'PECS') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Thẻ này chưa phù hợp với hoạt động này.'),
          backgroundColor: Colors.orange,
        ),
      );
      TtsService.instance.speak('Thẻ này chưa phù hợp với hoạt động này.');
      return;
    }

    final matchedCard = _resolvePecsCard(tag);
    if (matchedCard != null) {
      _onCardSelected(matchedCard);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Thẻ này chưa phù hợp với hoạt động này.'),
          backgroundColor: Colors.orange,
        ),
      );
      TtsService.instance.speak('Thẻ này chưa phù hợp với hoạt động này.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sinh hoạt hằng ngày'),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.blue.shade50, Colors.white],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Column(
                children: [
                  buildNfcIndicator(context),
                  const SizedBox(height: 12),
                  // Opening question card
                  GestureDetector(
                    onTap: _speakOpening,
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: Colors.blue.shade200, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.volume_up_rounded, color: Colors.blue.shade700, size: 32),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(
                              _openingQuestion,
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.blue.shade900,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Active PECS output card
                  Expanded(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: _selectedCard == null
                            ? _buildInstructionView()
                            : _buildSelectedCardView(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildInstructionView() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.contactless_rounded,
          size: 100,
          color: Colors.blue.shade300,
        ),
        const SizedBox(height: 24),
        Text(
          'Chạm thẻ hoạt động vào điện thoại.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.blue.shade800,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'App sẽ giúp con phát âm hoạt động hằng ngày nhé!',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 15,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget _buildSelectedCardView() {
    final hasImage = _selectedCard!['imageUrl'] != null && _selectedCard!['imageUrl'].isNotEmpty;
    return Card(
      elevation: 8,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(32),
          border: Border.all(color: Colors.blue.shade400, width: 3),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (hasImage) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(
                  _selectedCard!['imageUrl'],
                  height: 180,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => Icon(Icons.accessibility_new_rounded, size: 120, color: Colors.blue.shade300),
                ),
              ),
              const SizedBox(height: 24),
            ] else ...[
              Icon(Icons.accessibility_new_rounded, size: 140, color: Colors.blue.shade400),
              const SizedBox(height: 24),
            ],
            Text(
              _selectedCard!['title'] ?? '',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.blue.shade900,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                _selectedCard!['spokenText'] ?? '',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                  color: Colors.blue.shade800,
                ),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => _onCardSelected(_selectedCard!),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue.shade600,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              icon: const Icon(Icons.volume_up_rounded),
              label: const Text('Phát âm lại', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
