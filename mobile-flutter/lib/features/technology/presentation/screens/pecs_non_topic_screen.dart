import 'package:flutter/material.dart';
import '../../../../core/services/nfc_service.dart';
import '../../../../core/services/tts_service.dart';
import '../../../lessons/widgets/nfc_tts_mixin.dart';
import '../../data/technology_repository.dart';

class PecsNonTopicScreen extends StatefulWidget {
  const PecsNonTopicScreen({super.key});

  @override
  State<PecsNonTopicScreen> createState() => _PecsNonTopicScreenState();
}

class _PecsNonTopicScreenState extends State<PecsNonTopicScreen> with NfcTtsMixin {
  final _repository = TechnologyRepository();
  List<Map<String, dynamic>> _items = [];
  Map<String, dynamic>? _selectedCard;
  bool _isLoading = true;

  static const Map<String, String> _payloadToTitleMap = {
    'pecs_non_topic_drink': 'Uống nước',
    'pecs_non_topic_rest': 'Nghỉ',
    'pecs_non_topic_help': 'Cần giúp đỡ',
    'pecs_non_topic_pain': 'Con đau',
    'pecs_non_topic_play': 'Muốn chơi',
    'pecs_non_topic_toilet': 'Đi vệ sinh',
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final items = await _repository.getPecsCards(category: 'NON_TOPIC');
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

    // 2. Match by stable payloadValue
    final payload = tag.payloadValue;
    if (payload != null && payload.isNotEmpty) {
      final titleFromPayload = _payloadToTitleMap[payload];
      if (titleFromPayload != null) {
        for (final card in _items) {
          if (card['title']?.toString().toLowerCase() == titleFromPayload.toLowerCase()) {
            return card;
          }
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
      // 3. Fallback card using NFC response
      final fallbackCard = {
        'id': 'fallback',
        'title': tag.displayName.isNotEmpty ? tag.displayName : 'Yêu cầu',
        'spokenText': tag.spokenText ?? 'Nội dung này chưa được định nghĩa.',
        'imageUrl': '',
      };
      _onCardSelected(fallbackCard);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nhu cầu của con'),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.teal.shade50, Colors.white],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Column(
                children: [
                  buildNfcIndicator(context),
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
          color: Colors.teal.shade300,
        ),
        const SizedBox(height: 24),
        Text(
          'Chạm một thẻ bất kỳ để nói điều con muốn.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.teal.shade800,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'App sẽ giúp con phát âm yêu cầu ngay lập tức!',
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
          border: Border.all(color: Colors.teal.shade400, width: 3),
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
                  fit: const BoxFit.contain,
                  errorBuilder: (_, __, ___) => Icon(Icons.star_rounded, size: 120, color: Colors.teal.shade300),
                ),
              ),
              const SizedBox(height: 24),
            ] else ...[
              Icon(Icons.star_rounded, size: 140, color: Colors.teal.shade400),
              const SizedBox(height: 24),
            ],
            Text(
              _selectedCard!['title'] ?? '',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.extrabold,
                color: Colors.teal.shade900,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.teal.shade50,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                _selectedCard!['spokenText'] ?? '',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                  color: Colors.teal.shade800,
                ),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => _onCardSelected(_selectedCard!),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal.shade600,
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
