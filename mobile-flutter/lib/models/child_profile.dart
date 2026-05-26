import 'model_helpers.dart';
import 'domain.dart';

class ChildProfile {
  const ChildProfile({
    required this.id,
    required this.userId,
    required this.name,
    required this.age,
    this.gender = '',
    this.note = '',
    this.primaryDifficulty = DevelopmentCategoryKey.other,
    this.secondaryDifficulties = const [],
    this.learningGoals = const [],
    this.supportLevel = SupportLevel.medium,
    this.dailyDurationMinutes = 5,
    this.coLearningMode = CoLearningMode.parentChildTogether,
    this.interests = const [],
    this.accessibilityPreferences = const {},
    this.currentPathId,
    this.currentProgramId,
    this.selectedAt,
    this.avatarUrl,
  });

  final String id;
  final String userId;
  final String name;
  final int age;
  final String gender;
  final String note;
  final DevelopmentCategoryKey primaryDifficulty;
  final List<DevelopmentCategoryKey> secondaryDifficulties;
  final List<LearningGoalKey> learningGoals;
  final SupportLevel supportLevel;
  final int dailyDurationMinutes;
  final CoLearningMode coLearningMode;
  final List<String> interests;
  final Map<String, dynamic> accessibilityPreferences;
  final String? currentPathId;
  final String? currentProgramId;
  final DateTime? selectedAt;
  final String? avatarUrl;

  String get displayName => name;

  factory ChildProfile.fromMap(String id, Map<String, dynamic> map) =>
      ChildProfile(
        id: id,
        userId: '${map['userId'] ?? ''}',
        name: '${map['displayName'] ?? map['name'] ?? ''}',
        age: readInt(map['age']),
        gender: '${map['gender'] ?? ''}',
        note: '${map['note'] ?? ''}',
        primaryDifficulty: developmentCategoryFromString(
          map['primaryDifficulty'],
        ),
        secondaryDifficulties: developmentCategoryListFrom(
          map['secondaryDifficulties'],
        ),
        learningGoals: learningGoalListFrom(map['learningGoals']),
        supportLevel: supportLevelFromString(map['supportLevel']),
        dailyDurationMinutes: readInt(map['dailyDurationMinutes'], 5),
        coLearningMode: coLearningModeFromString(map['coLearningMode']),
        interests: readStringList(map['interests']),
        accessibilityPreferences: readMap(map['accessibilityPreferences']),
        currentPathId: map['currentPathId'] as String?,
        currentProgramId: map['currentProgramId'] as String?,
        selectedAt: readDate(map['selectedAt']),
        avatarUrl: map['avatarUrl'] as String? ?? map['avatar_url'] as String?,
      );

  Map<String, dynamic> toMap() => {
    'userId': userId,
    'displayName': name,
    'name': name,
    'age': age,
    'gender': gender,
    'note': note,
    'primaryDifficulty': primaryDifficulty.apiValue,
    'secondaryDifficulties': secondaryDifficulties
        .map((item) => item.apiValue)
        .toList(),
    'learningGoals': learningGoals.map((item) => item.apiValue).toList(),
    'supportLevel': supportLevel.apiValue,
    'dailyDurationMinutes': dailyDurationMinutes,
    'coLearningMode': coLearningMode.apiValue,
    'interests': interests,
    'accessibilityPreferences': accessibilityPreferences,
    'currentPathId': currentPathId,
    'currentProgramId': currentProgramId,
    'selectedAt': selectedAt?.toIso8601String(),
    'avatarUrl': avatarUrl,
  };

  ChildProfile copyWith({
    String? name,
    int? age,
    String? gender,
    String? note,
    DevelopmentCategoryKey? primaryDifficulty,
    List<DevelopmentCategoryKey>? secondaryDifficulties,
    List<LearningGoalKey>? learningGoals,
    SupportLevel? supportLevel,
    int? dailyDurationMinutes,
    CoLearningMode? coLearningMode,
    List<String>? interests,
    Map<String, dynamic>? accessibilityPreferences,
    String? currentPathId,
    String? currentProgramId,
    DateTime? selectedAt,
    String? avatarUrl,
  }) => ChildProfile(
    id: id,
    userId: userId,
    name: name ?? this.name,
    age: age ?? this.age,
    gender: gender ?? this.gender,
    note: note ?? this.note,
    primaryDifficulty: primaryDifficulty ?? this.primaryDifficulty,
    secondaryDifficulties: secondaryDifficulties ?? this.secondaryDifficulties,
    learningGoals: learningGoals ?? this.learningGoals,
    supportLevel: supportLevel ?? this.supportLevel,
    dailyDurationMinutes: dailyDurationMinutes ?? this.dailyDurationMinutes,
    coLearningMode: coLearningMode ?? this.coLearningMode,
    interests: interests ?? this.interests,
    accessibilityPreferences:
        accessibilityPreferences ?? this.accessibilityPreferences,
    currentPathId: currentPathId ?? this.currentPathId,
    currentProgramId: currentProgramId ?? this.currentProgramId,
    selectedAt: selectedAt ?? this.selectedAt,
    avatarUrl: avatarUrl ?? this.avatarUrl,
  );
}
