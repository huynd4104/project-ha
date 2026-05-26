enum TranscriptSource { deviceStt, geminiLive, debugInput }

class TranscriptResult {
  const TranscriptResult({
    required this.text,
    required this.confidence,
    required this.source,
    this.language = 'vi-VN',
    this.startedAt,
    this.endedAt,
  });

  final String text;
  final double confidence;
  final TranscriptSource source;
  final String language;
  final DateTime? startedAt;
  final DateTime? endedAt;

  bool get isEmpty => text.trim().isEmpty;
  bool get isNotEmpty => !isEmpty;
}
