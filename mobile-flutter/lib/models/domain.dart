import 'model_helpers.dart';

enum DevelopmentCategoryKey {
  speechDelay,
  attentionDifficulty,
  cognitiveDelay,
  socialCommunication,
  emotionRecognition,
  dailyLifeSkill,
  other,
}

enum LearningGoalKey {
  listening,
  speaking,
  objectRecognition,
  emotionRecognition,
  dailyCommunication,
  matching,
  counting,
  followInstruction,
  parentChildActivity,
}

enum SupportLevel { low, medium, high }

enum CoLearningMode {
  childWithGuidance,
  parentChildTogether,
  specialistSupport,
}

enum LearningLevel { beginner, basic, intermediate }

enum AccessType { free, premium }

enum PublishStatus { draft, published, archived }

enum UnlockRule { alwaysOpen, previousCompleted, manualUnlock, premiumOnly }

enum ActivityType {
  listenAndChooseImage,
  lookAndChooseWord,
  hearAndRepeat,
  voiceAnswer,
  matchObjects,
  emotionRecognition,
  dailyLifeScenario,
  multipleChoice,
  flashcardReview,
  parentMarkResult,
}

String enumKey(Enum value) => _upperSnake(value.name);

DevelopmentCategoryKey developmentCategoryFromString(Object? value) => readEnum(
  DevelopmentCategoryKey.values,
  _camelFromUpperSnake(value),
  DevelopmentCategoryKey.other,
);

List<DevelopmentCategoryKey> developmentCategoryListFrom(Object? value) =>
    readStringList(value)
        .map(developmentCategoryFromString)
        .where((item) => item != DevelopmentCategoryKey.other)
        .toList();

LearningGoalKey learningGoalFromString(Object? value) => readEnum(
  LearningGoalKey.values,
  _camelFromUpperSnake(value),
  LearningGoalKey.listening,
);

List<LearningGoalKey> learningGoalListFrom(Object? value) {
  final names = readStringList(
    value,
  ).map(_camelFromUpperSnake).map((item) => item.toUpperCase()).toSet();
  return LearningGoalKey.values
      .where((item) => names.contains(item.name.toUpperCase()))
      .toList();
}

SupportLevel supportLevelFromString(Object? value) => readEnum(
  SupportLevel.values,
  _camelFromUpperSnake(value),
  SupportLevel.medium,
);

CoLearningMode coLearningModeFromString(Object? value) => readEnum(
  CoLearningMode.values,
  _camelFromUpperSnake(value),
  CoLearningMode.parentChildTogether,
);

LearningLevel learningLevelFromString(Object? value) => readEnum(
  LearningLevel.values,
  _camelFromUpperSnake(value),
  LearningLevel.beginner,
);

AccessType accessTypeFromString(Object? value) =>
    readEnum(AccessType.values, _camelFromUpperSnake(value), AccessType.free);

PublishStatus publishStatusFromString(Object? value) => readEnum(
  PublishStatus.values,
  _camelFromUpperSnake(value),
  PublishStatus.draft,
);

UnlockRule unlockRuleFromString(Object? value) => readEnum(
  UnlockRule.values,
  _camelFromUpperSnake(value),
  UnlockRule.alwaysOpen,
);

ActivityType activityTypeFromString(Object? value) => readEnum(
  ActivityType.values,
  _camelFromUpperSnake(value),
  ActivityType.multipleChoice,
);

String skillLabel(String key) {
  switch (key.toUpperCase()) {
    case 'LISTENING':
      return 'Lắng nghe';
    case 'SPEAKING':
      return 'Nói';
    case 'OBJECT_RECOGNITION':
      return 'Nhận biết đồ vật';
    case 'EMOTION_RECOGNITION':
      return 'Nhận biết cảm xúc';
    case 'DAILY_COMMUNICATION':
      return 'Giao tiếp hằng ngày';
    case 'MATCHING':
      return 'Ghép đôi';
    case 'COUNTING':
      return 'Đếm số';
    case 'FOLLOW_INSTRUCTION':
      return 'Làm theo hướng dẫn';
    case 'PARENT_CHILD_ACTIVITY':
      return 'Hoạt động cùng phụ huynh';
    default:
      return key;
  }
}

extension DevelopmentCategoryLabel on DevelopmentCategoryKey {
  String get apiValue => enumKey(this);
  String get label => switch (this) {
    DevelopmentCategoryKey.speechDelay => 'Chậm nói / khó khăn lời nói',
    DevelopmentCategoryKey.attentionDifficulty => 'Khó tập trung',
    DevelopmentCategoryKey.cognitiveDelay => 'Chậm phát triển nhận thức',
    DevelopmentCategoryKey.socialCommunication => 'Giao tiếp xã hội',
    DevelopmentCategoryKey.emotionRecognition => 'Nhận biết cảm xúc',
    DevelopmentCategoryKey.dailyLifeSkill => 'Kỹ năng sinh hoạt',
    DevelopmentCategoryKey.other => 'Khác / chưa xác định',
  };
}

extension LearningGoalLabel on LearningGoalKey {
  String get apiValue => enumKey(this);
  String get label => skillLabel(apiValue);
}

extension SupportLevelLabel on SupportLevel {
  String get apiValue => enumKey(this);
  String get label => switch (this) {
    SupportLevel.low => 'Cần hỗ trợ ít',
    SupportLevel.medium => 'Cần hỗ trợ vừa',
    SupportLevel.high => 'Cần hỗ trợ nhiều',
  };
}

extension CoLearningModeLabel on CoLearningMode {
  String get apiValue => enumKey(this);
  String get label => switch (this) {
    CoLearningMode.childWithGuidance => 'Bé học với hướng dẫn',
    CoLearningMode.parentChildTogether => 'Phụ huynh và bé cùng học',
    CoLearningMode.specialistSupport => 'Có chuyên gia hỗ trợ thêm',
  };
}

extension LearningLevelLabel on LearningLevel {
  String get apiValue => enumKey(this);
}

extension AccessTypeLabel on AccessType {
  String get apiValue => enumKey(this);
}

extension PublishStatusLabel on PublishStatus {
  String get apiValue => enumKey(this);
}

extension UnlockRuleLabel on UnlockRule {
  String get apiValue => enumKey(this);
}

extension ActivityTypeLabel on ActivityType {
  String get apiValue => enumKey(this);
}

class DevelopmentCategory {
  const DevelopmentCategory({
    required this.id,
    required this.key,
    required this.label,
    this.parentDescription = '',
    this.isActive = true,
    this.orderIndex = 0,
  });

  final String id;
  final DevelopmentCategoryKey key;
  final String label;
  final String parentDescription;
  final bool isActive;
  final int orderIndex;

  factory DevelopmentCategory.fromMap(String id, Map<String, dynamic> map) =>
      DevelopmentCategory(
        id: id,
        key: developmentCategoryFromString(map['key'] ?? id),
        label: '${map['label'] ?? ''}',
        parentDescription: '${map['parentDescription'] ?? ''}',
        isActive: map['isActive'] != false,
        orderIndex: readInt(map['orderIndex']),
      );
}

class LearningGoal {
  const LearningGoal({
    required this.id,
    required this.key,
    required this.label,
    this.parentDescription = '',
    this.skillTags = const [],
    this.isActive = true,
    this.orderIndex = 0,
  });

  final String id;
  final LearningGoalKey key;
  final String label;
  final String parentDescription;
  final List<String> skillTags;
  final bool isActive;
  final int orderIndex;

  factory LearningGoal.fromMap(String id, Map<String, dynamic> map) =>
      LearningGoal(
        id: id,
        key: learningGoalFromString(map['key'] ?? id),
        label: '${map['label'] ?? ''}',
        parentDescription: '${map['parentDescription'] ?? ''}',
        skillTags: readStringList(map['skillTags']),
        isActive: map['isActive'] != false,
        orderIndex: readInt(map['orderIndex']),
      );
}

class Skill {
  const Skill({
    required this.id,
    required this.key,
    required this.label,
    this.domain = '',
    this.parentDescription = '',
    this.isActive = true,
    this.orderIndex = 0,
  });

  final String id;
  final String key;
  final String label;
  final String domain;
  final String parentDescription;
  final bool isActive;
  final int orderIndex;

  factory Skill.fromMap(String id, Map<String, dynamic> map) => Skill(
    id: id,
    key: '${map['key'] ?? id}',
    label: '${map['label'] ?? ''}',
    domain: '${map['domain'] ?? ''}',
    parentDescription: '${map['parentDescription'] ?? ''}',
    isActive: map['isActive'] != false,
    orderIndex: readInt(map['orderIndex']),
  );
}

class Program {
  const Program({
    required this.id,
    required this.title,
    this.description = '',
    this.targetAgeMin = 0,
    this.targetAgeMax = 99,
    this.difficultyCategories = const [],
    this.learningGoals = const [],
    this.skillTags = const [],
    this.level = LearningLevel.beginner,
    this.accessType = AccessType.free,
    this.status = PublishStatus.draft,
  });

  final String id;
  final String title;
  final String description;
  final int targetAgeMin;
  final int targetAgeMax;
  final List<DevelopmentCategoryKey> difficultyCategories;
  final List<LearningGoalKey> learningGoals;
  final List<String> skillTags;
  final LearningLevel level;
  final AccessType accessType;
  final PublishStatus status;

  factory Program.fromMap(String id, Map<String, dynamic> map) => Program(
    id: id,
    title: '${map['title'] ?? ''}',
    description: '${map['description'] ?? ''}',
    targetAgeMin: readInt(map['targetAgeMin']),
    targetAgeMax: readInt(map['targetAgeMax'], 99),
    difficultyCategories: developmentCategoryListFrom(
      map['difficultyCategories'],
    ),
    learningGoals: learningGoalListFrom(map['learningGoals']),
    skillTags: readStringList(map['skillTags']),
    level: learningLevelFromString(map['level']),
    accessType: accessTypeFromString(map['accessType']),
    status: publishStatusFromString(map['status']),
  );
}

class LearningPath {
  const LearningPath({
    required this.id,
    required this.programId,
    required this.title,
    this.description = '',
    this.targetProfileRules = const {},
    this.level = LearningLevel.beginner,
    this.orderIndex = 0,
    this.accessType = AccessType.free,
    this.status = PublishStatus.draft,
  });

  final String id;
  final String programId;
  final String title;
  final String description;
  final Map<String, dynamic> targetProfileRules;
  final LearningLevel level;
  final int orderIndex;
  final AccessType accessType;
  final PublishStatus status;

  factory LearningPath.fromMap(String id, Map<String, dynamic> map) =>
      LearningPath(
        id: id,
        programId: '${map['programId'] ?? ''}',
        title: '${map['title'] ?? ''}',
        description: '${map['description'] ?? ''}',
        targetProfileRules: readMap(map['targetProfileRules']),
        level: learningLevelFromString(map['level']),
        orderIndex: readInt(map['orderIndex']),
        accessType: accessTypeFromString(map['accessType']),
        status: publishStatusFromString(map['status']),
      );
}

class PathItem {
  const PathItem({
    required this.id,
    required this.pathId,
    required this.lessonId,
    this.sequence = 0,
    this.unlockRule = UnlockRule.alwaysOpen,
    this.prerequisiteLessonIds = const [],
    this.requiredCompletion = true,
  });

  final String id;
  final String pathId;
  final String lessonId;
  final int sequence;
  final UnlockRule unlockRule;
  final List<String> prerequisiteLessonIds;
  final bool requiredCompletion;

  factory PathItem.fromMap(String id, Map<String, dynamic> map) {
    final reqVal = map['requiredCompletion'];
    bool reqBool = true;
    if (reqVal is bool) {
      reqBool = reqVal;
    } else if (reqVal is Map) {
      reqBool = true;
    }
    return PathItem(
      id: id,
      pathId: '${map['pathId'] ?? ''}',
      lessonId: '${map['lessonId'] ?? ''}',
      sequence: readInt(map['sequence']),
      unlockRule: unlockRuleFromString(map['unlockRule']),
      prerequisiteLessonIds: readStringList(map['prerequisiteLessonIds']),
      requiredCompletion: reqBool,
    );
  }
}

class ActivityMediaRef {
  const ActivityMediaRef({
    required this.type,
    required this.url,
    this.label = '',
  });

  final String type;
  final String url;
  final String label;

  factory ActivityMediaRef.fromMap(Map<String, dynamic> map) =>
      ActivityMediaRef(
        type: '${map['type'] ?? ''}',
        url: '${map['url'] ?? ''}',
        label: '${map['label'] ?? ''}',
      );

  Map<String, dynamic> toMap() => {'type': type, 'url': url, 'label': label};
}

class ActivityOption {
  const ActivityOption({
    required this.id,
    this.text = '',
    this.imageUrl,
    this.audioUrl,
    this.isCorrect = false,
  });

  final String id;
  final String text;
  final String? imageUrl;
  final String? audioUrl;
  final bool isCorrect;

  factory ActivityOption.fromMap(Map<String, dynamic> map) => ActivityOption(
    id: '${map['id'] ?? ''}',
    text: '${map['text'] ?? ''}',
    imageUrl: map['imageUrl']?.toString(),
    audioUrl: map['audioUrl']?.toString(),
    isCorrect: map['isCorrect'] == true,
  );

  Map<String, dynamic> toMap() => {
    'id': id,
    'text': text,
    'imageUrl': imageUrl,
    'audioUrl': audioUrl,
    'isCorrect': isCorrect,
  };
}

class ActivityFeedback {
  const ActivityFeedback({
    this.correct = '',
    this.almost = '',
    this.wrong = '',
    this.hint = '',
  });

  final String correct;
  final String almost;
  final String wrong;
  final String hint;

  factory ActivityFeedback.fromMap(Map<String, dynamic> map) =>
      ActivityFeedback(
        correct: '${map['correct'] ?? ''}',
        almost: '${map['almost'] ?? ''}',
        wrong: '${map['wrong'] ?? ''}',
        hint: '${map['hint'] ?? ''}',
      );

  Map<String, dynamic> toMap() => {
    'correct': correct,
    'almost': almost,
    'wrong': wrong,
    'hint': hint,
  };
}

class Activity {
  const Activity({
    required this.id,
    required this.lessonId,
    this.activityType = ActivityType.multipleChoice,
    this.orderIndex = 0,
    this.prompt = '',
    this.instruction = '',
    this.mediaRefs = const [],
    this.options = const [],
    this.correctAnswers = const [],
    this.acceptedAnswers = const [],
    this.almostAnswers = const [],
    this.feedback = const ActivityFeedback(),
    this.retryLimit = 1,
    this.skillTags = const [],
    this.parentInstruction = '',
    this.accessType = AccessType.free,
    this.isActive = true,
    this.audioUrl,
    this.imageUrl,
    this.ttsPromptText,
    this.voicePremiumRequired = false,
  });

  final String id;
  final String lessonId;
  final ActivityType activityType;
  final int orderIndex;
  final String prompt;
  final String instruction;
  final List<ActivityMediaRef> mediaRefs;
  final List<ActivityOption> options;
  final List<String> correctAnswers;
  final List<String> acceptedAnswers;
  final List<String> almostAnswers;
  final ActivityFeedback feedback;
  final int retryLimit;
  final List<String> skillTags;
  final String parentInstruction;
  final AccessType accessType;
  final bool isActive;
  final String? audioUrl;
  final String? imageUrl;
  final String? ttsPromptText;
  final bool voicePremiumRequired;

  factory Activity.fromMap(String id, Map<String, dynamic> map) => Activity(
    id: id,
    lessonId: '${map['lessonId'] ?? ''}',
    activityType: activityTypeFromString(map['activityType']),
    orderIndex: readInt(map['orderIndex']),
    prompt: '${map['prompt'] ?? ''}',
    instruction: '${map['instruction'] ?? ''}',
    mediaRefs: (map['mediaRefs'] as List? ?? const [])
        .whereType<Map>()
        .map(
          (item) => ActivityMediaRef.fromMap(Map<String, dynamic>.from(item)),
        )
        .toList(),
    options: (map['options'] as List? ?? const [])
        .whereType<Map>()
        .map((item) => ActivityOption.fromMap(Map<String, dynamic>.from(item)))
        .toList(),
    correctAnswers: readStringList(map['correctAnswers']),
    acceptedAnswers: readStringList(map['acceptedAnswers']),
    almostAnswers: readStringList(map['almostAnswers']),
    feedback: ActivityFeedback.fromMap(readMap(map['feedback'])),
    retryLimit: readInt(map['retryLimit'], 1),
    skillTags: readStringList(map['skillTags']),
    parentInstruction: '${map['parentInstruction'] ?? ''}',
    accessType: accessTypeFromString(map['accessType']),
    isActive: map['isActive'] != false,
    audioUrl: map['audioUrl']?.toString(),
    imageUrl: map['imageUrl']?.toString(),
    ttsPromptText: map['ttsPromptText']?.toString(),
    voicePremiumRequired: map['voicePremiumRequired'] == true,
  );
}

class ActivityAttempt {
  const ActivityAttempt({
    required this.id,
    required this.userId,
    required this.childId,
    required this.lessonId,
    this.activityId,
    this.activityType = 'LEGACY',
    this.result = 'RECORDED',
    this.score = 0,
    this.skillTags = const [],
  });

  final String id;
  final String userId;
  final String childId;
  final String lessonId;
  final String? activityId;
  final String activityType;
  final String result;
  final double score;
  final List<String> skillTags;

  factory ActivityAttempt.fromMap(String id, Map<String, dynamic> map) =>
      ActivityAttempt(
        id: id,
        userId: '${map['userId'] ?? ''}',
        childId: '${map['childId'] ?? ''}',
        lessonId: '${map['lessonId'] ?? ''}',
        activityId: map['activityId']?.toString(),
        activityType: '${map['activityType'] ?? 'LEGACY'}',
        result: '${map['result'] ?? 'RECORDED'}',
        score: readDouble(map['score']),
        skillTags: readStringList(map['skillTags']),
      );
}

class LessonProgress {
  const LessonProgress({
    required this.id,
    required this.userId,
    required this.childId,
    required this.lessonId,
    this.status = 'NOT_STARTED',
    this.bestScore = 0,
    this.attemptsCount = 0,
  });

  final String id;
  final String userId;
  final String childId;
  final String lessonId;
  final String status;
  final int bestScore;
  final int attemptsCount;

  factory LessonProgress.fromMap(String id, Map<String, dynamic> map) =>
      LessonProgress(
        id: id,
        userId: '${map['userId'] ?? ''}',
        childId: '${map['childId'] ?? ''}',
        lessonId: '${map['lessonId'] ?? ''}',
        status: '${map['status'] ?? 'NOT_STARTED'}',
        bestScore: readInt(map['bestScore']),
        attemptsCount: readInt(map['attemptsCount']),
      );
}

class ActivationCode {
  const ActivationCode({
    required this.id,
    required this.code,
    this.activationType = 'NPC',
    this.targetId = '',
    this.npcId,
    this.isActive = true,
    this.active = true,
    this.maxUses,
    this.usedCount = 0,
    this.label = '',
    this.perUserLimit,
    this.expiresAt,
    this.source = 'QR',
  });

  final String id;
  final String code;
  final String activationType;
  final String targetId;
  final String? npcId;
  final bool isActive;
  final bool active;
  final int? maxUses;
  final int usedCount;
  final String label;
  final int? perUserLimit;
  final DateTime? expiresAt;
  final String source;

  factory ActivationCode.fromMap(String id, Map<String, dynamic> map) =>
      ActivationCode(
        id: id,
        code: '${map['code'] ?? ''}',
        activationType: '${map['activationType'] ?? 'NPC'}',
        targetId: '${map['targetId'] ?? map['npcId'] ?? ''}',
        npcId: map['npcId']?.toString(),
        isActive: map['isActive'] != false,
        active: map['active'] != false,
        maxUses: map['maxUses'] == null ? null : readInt(map['maxUses']),
        usedCount: readInt(map['usedCount']),
        label: '${map['label'] ?? ''}',
        perUserLimit: map['perUserLimit'] == null
            ? null
            : readInt(map['perUserLimit']),
        expiresAt: readDate(map['expiresAt']),
        source: '${map['source'] ?? 'QR'}',
      );
}

class ActivationRedemption {
  const ActivationRedemption({
    required this.id,
    required this.userId,
    required this.childId,
    required this.code,
    this.activationType = 'NPC',
    this.targetId = '',
  });

  final String id;
  final String userId;
  final String childId;
  final String code;
  final String activationType;
  final String targetId;

  factory ActivationRedemption.fromMap(String id, Map<String, dynamic> map) =>
      ActivationRedemption(
        id: id,
        userId: '${map['userId'] ?? ''}',
        childId: '${map['childId'] ?? ''}',
        code: '${map['code'] ?? ''}',
        activationType: '${map['activationType'] ?? 'NPC'}',
        targetId: '${map['targetId'] ?? map['npcId'] ?? ''}',
      );
}

class VoiceUsageLog {
  const VoiceUsageLog({
    required this.id,
    required this.userId,
    required this.childId,
    this.activityId,
    this.provider = '',
    this.durationSec = 0,
  });

  final String id;
  final String userId;
  final String childId;
  final String? activityId;
  final String provider;
  final int durationSec;

  factory VoiceUsageLog.fromMap(String id, Map<String, dynamic> map) =>
      VoiceUsageLog(
        id: id,
        userId: '${map['userId'] ?? ''}',
        childId: '${map['childId'] ?? ''}',
        activityId: map['activityId']?.toString(),
        provider: '${map['provider'] ?? ''}',
        durationSec: readInt(map['durationSec']),
      );
}

String _upperSnake(String value) {
  final buffer = StringBuffer();
  for (var i = 0; i < value.length; i++) {
    final code = value.codeUnitAt(i);
    final isUpper = code >= 65 && code <= 90;
    if (i > 0 && isUpper) buffer.write('_');
    buffer.write(value[i].toUpperCase());
  }
  return buffer.toString();
}

String _camelFromUpperSnake(Object? value) {
  final raw = '${value ?? ''}'.trim();
  if (!raw.contains('_')) return raw;
  final lower = raw.toLowerCase();
  final parts = lower.split('_');
  return parts.first +
      parts
          .skip(1)
          .map(
            (part) => part.isEmpty
                ? ''
                : '${part[0].toUpperCase()}${part.substring(1)}',
          )
          .join();
}
