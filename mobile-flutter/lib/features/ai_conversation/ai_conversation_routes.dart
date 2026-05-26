class AiConversationRoutes {
  const AiConversationRoutes._();

  static const topics = '/ai-conversations/topics';
  static const parentDashboard = '/parent/ai-conversations';

  static String intro(String topicId) =>
      '/ai-conversations/topics/$topicId/intro';
  static String live(String topicId) =>
      '/ai-conversations/topics/$topicId/live';
  static String summary(String sessionId) =>
      '/ai-conversations/sessions/$sessionId/summary';
  static String parentTopic(String topicId) =>
      '/parent/ai-conversations/topics/$topicId';
  static String parentSession(String sessionId) =>
      '/parent/ai-conversations/sessions/$sessionId';
}
