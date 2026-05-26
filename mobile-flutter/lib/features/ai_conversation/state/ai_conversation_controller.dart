import 'package:flutter/foundation.dart';

import '../data/models/ai_conversation_topic.dart';
import '../data/repositories/ai_conversation_repository.dart';

class AiConversationController extends ChangeNotifier {
  AiConversationController({AiConversationRepository? repository})
    : _repository = repository ?? AiConversationRepository();

  final AiConversationRepository _repository;
  bool loading = false;
  String? error;
  List<AiConversationTopic> topics = const [];

  Future<void> loadTopics() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      topics = await _repository.topics();
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }
}
