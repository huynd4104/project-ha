import 'package:flutter/material.dart';
import '../../../../core/services/nfc_service.dart';
import '../../../../core/services/tts_service.dart';
import '../../../../core/utils/nfc_value_normalizer.dart';
import '../../../lessons/widgets/nfc_tts_mixin.dart';
import '../../data/technology_repository.dart';
import 'pecs_nfc_deep_link_utils.dart';

class PecsEmotionScreen extends StatefulWidget {
  const PecsEmotionScreen({
    super.key,
    this.initialNfcPayload,
    this.isDeepLinkAnswer = false,
  });

  final String? initialNfcPayload;
  final bool isDeepLinkAnswer;

  @override
  State<PecsEmotionScreen> createState() => _PecsEmotionScreenState();
}

class _PecsEmotionScreenState extends State<PecsEmotionScreen> with NfcTtsMixin {
  final _repository = TechnologyRepository();
  List<Map<String, dynamic>> _items = [];
  Map<String, dynamic>? _selectedCard;
  bool _isLoading = true;
  bool _isResolvingDeepLink = false;
  String? _statusMessage;
  bool _hasHandledInitialDeepLinkAudio = false;

  final String _openingQuestion = 'Hôm nay bạn cảm thấy như thế nào?';

  bool get _hasDeepLinkAnswer =>
      widget.isDeepLinkAnswer &&
      (widget.initialNfcPayload?.trim().isNotEmpty ?? false);

  @override
  bool get enableNfcListening => !_hasDeepLinkAnswer;

  @override
  void initState() {
    super.initState();
    _loadData();
    if (_hasDeepLinkAnswer) {
      _resolveInitialDeepLink();
    } else {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _speakOpening();
      });
    }
  }

  Future<void> _loadData() async {
    try {
      final items = await _repository.getPecsCards(category: 'EMOTION');
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

  Future<void> _resolveInitialDeepLink() async {
    final payload = widget.initialNfcPayload?.trim();
    if (payload == null || payload.isEmpty) return;

    logPecsDeepLinkDebug(
      screenName: 'PecsEmotion',
      stage: 'start',
      payload: payload,
      mode: widget.isDeepLinkAnswer ? 'answer' : 'normal',
    );

    if (mounted) {
      setState(() {
        _isResolvingDeepLink = true;
        _statusMessage = null;
      });
    }

    try {
      final resolvedData = await resolveNfcPayload(payload);
      final tagType = resolvedData['tagType']?.toString().trim().toUpperCase();
      final category = resolvedPecsCategory(resolvedData);
      final metadata = resolvedData['metadata'];
      final metadataMap = metadata is Map
          ? Map<String, dynamic>.from(metadata)
          : <String, dynamic>{};
      final spokenText = resolvedData['spokenText']?.toString() ??
          metadataMap['spokenText']?.toString() ??
          '';

      logPecsDeepLinkDebug(
        screenName: 'PecsEmotion',
        stage: 'resolved',
        payload: payload,
        mode: widget.isDeepLinkAnswer ? 'answer' : 'normal',
        resolvedCategory: category,
        spokenText: spokenText,
        willSpeak: true,
      );

      if (tagType != 'PECS' || category != 'EMOTION') {
        final message = 'Thẻ này chưa phù hợp với hoạt động cảm xúc.';
        logPecsDeepLinkDebug(
          screenName: 'PecsEmotion',
          stage: 'validation-failed',
          payload: payload,
          mode: widget.isDeepLinkAnswer ? 'answer' : 'normal',
          resolvedCategory: category,
          spokenText: message,
          willSpeak: true,
          note: 'wrong-category',
        );
        if (!mounted) return;
        setState(() {
          _selectedCard = null;
          _statusMessage = message;
        });
        _queueInitialDeepLinkSpeech(message, note: 'wrong-category');
        return;
      }

      final card = buildPecsResolvedCard(resolvedData);
      if (!mounted) return;
      setState(() {
        _selectedCard = card;
        _statusMessage = null;
      });
      _queueInitialDeepLinkSpeech(
        card['spokenText']?.toString() ?? '',
        note: 'answer-mode-result',
      );
    } catch (_) {
      const message = 'Không thể đọc thẻ NFC này. Hãy thử lại.';
      logPecsDeepLinkDebug(
        screenName: 'PecsEmotion',
        stage: 'error',
        payload: payload,
        mode: widget.isDeepLinkAnswer ? 'answer' : 'normal',
        spokenText: message,
        willSpeak: true,
      );
      if (!mounted) return;
      setState(() {
        _selectedCard = null;
        _statusMessage = message;
      });
      _queueInitialDeepLinkSpeech(message, note: 'error');
    } finally {
      if (mounted) {
        setState(() {
          _isResolvingDeepLink = false;
        });
      }
    }
  }

  void _onCardSelected(Map<String, dynamic> card) {
    setState(() {
      _selectedCard = card;
      _statusMessage = null;
    });
    final text = card['spokenText'] ?? card['title'] ?? '';
    TtsService.instance.speak(text);
  }

  void _queueInitialDeepLinkSpeech(String text, {required String note}) {
    if (text.trim().isEmpty || _hasHandledInitialDeepLinkAudio) return;

    logPecsDeepLinkDebug(
      screenName: 'PecsEmotion',
      stage: 'schedule-speak',
      payload: widget.initialNfcPayload?.trim() ?? '',
      mode: widget.isDeepLinkAnswer ? 'answer' : 'normal',
      spokenText: text,
      willSpeak: true,
      note: note,
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _hasHandledInitialDeepLinkAudio) return;
      _hasHandledInitialDeepLinkAudio = true;
      logPecsDeepLinkDebug(
        screenName: 'PecsEmotion',
        stage: 'speak-now',
        payload: widget.initialNfcPayload?.trim() ?? '',
        mode: widget.isDeepLinkAnswer ? 'answer' : 'normal',
        spokenText: text,
        willSpeak: true,
        note: note,
      );
      TtsService.instance.speak(text);
    });
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
    final navButton = buildPecsNavigationButton(context);
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leadingWidth: 56,
        leading: navButton,
        title: const Text('Cảm xúc của con'),
        centerTitle: true,
      ),
      body: (_isLoading || _isResolvingDeepLink) && _selectedCard == null && _statusMessage == null
          ? const Center(child: CircularProgressIndicator())
          : Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.orange.shade50, Colors.white],
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
                        border: Border.all(color: Colors.orange.shade200, width: 2),
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
                          Icon(Icons.volume_up_rounded, color: Colors.orange.shade700, size: 32),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(
                              _openingQuestion,
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.orange.shade900,
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
                            ? (_statusMessage != null
                                ? _buildStatusView(_statusMessage!)
                                : _buildInstructionView())
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
          color: Colors.orange.shade300,
        ),
        const SizedBox(height: 24),
        Text(
          'Chạm thẻ cảm xúc vào điện thoại.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.orange.shade800,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'App sẽ giúp con nói cảm xúc của mình nhé!',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 15,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusView(String message) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.info_outline_rounded,
          size: 100,
          color: Colors.orange.shade300,
        ),
        const SizedBox(height: 24),
        Text(
          message,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.orange.shade800,
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
          border: Border.all(color: Colors.orange.shade400, width: 3),
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
                  errorBuilder: (_, __, ___) => Icon(Icons.sentiment_satisfied_alt_rounded, size: 120, color: Colors.orange.shade300),
                ),
              ),
              const SizedBox(height: 24),
            ] else ...[
              Icon(Icons.sentiment_satisfied_alt_rounded, size: 140, color: Colors.orange.shade400),
              const SizedBox(height: 24),
            ],
            Text(
              _selectedCard!['title'] ?? '',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.orange.shade900,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                _selectedCard!['spokenText'] ?? '',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                  color: Colors.orange.shade800,
                ),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => _onCardSelected(_selectedCard!),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange.shade600,
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
