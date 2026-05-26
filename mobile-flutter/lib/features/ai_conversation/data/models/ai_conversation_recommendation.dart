class AiConversationRecommendation {
  const AiConversationRecommendation({
    required this.title,
    required this.description,
    required this.topicId,
    required this.topicTitle,
    required this.priority,
  });

  final String title;
  final String description;
  final String topicId;
  final String topicTitle;
  final int priority;

  factory AiConversationRecommendation.fromMap(Map<String, dynamic> map) =>
      AiConversationRecommendation(
        title: '${map['title'] ?? ''}',
        description: '${map['description'] ?? map['message'] ?? ''}',
        topicId: '${map['topicId'] ?? ''}',
        topicTitle: '${map['topicTitle'] ?? ''}',
        priority: map['priority'] is num ? (map['priority'] as num).toInt() : 0,
      );
}
