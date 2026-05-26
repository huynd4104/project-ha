import 'model_helpers.dart';
import 'domain.dart';

class NPCDialogueTemplates {
  const NPCDialogueTemplates({
    this.welcome = '',
    this.beforeActivity = '',
    this.correct = '',
    this.wrong = '',
    this.lessonComplete = '',
    this.encouragement = '',
  });

  final String welcome;
  final String beforeActivity;
  final String correct;
  final String wrong;
  final String lessonComplete;
  final String encouragement;

  factory NPCDialogueTemplates.fromMap(Map<String, dynamic> map) =>
      NPCDialogueTemplates(
        welcome: '${map['welcome'] ?? ''}',
        beforeActivity: '${map['beforeActivity'] ?? ''}',
        correct: '${map['correct'] ?? ''}',
        wrong: '${map['wrong'] ?? ''}',
        lessonComplete: '${map['lessonComplete'] ?? ''}',
        encouragement: '${map['encouragement'] ?? ''}',
      );

  Map<String, dynamic> toMap() => {
    'welcome': welcome,
    'beforeActivity': beforeActivity,
    'correct': correct,
    'wrong': wrong,
    'lessonComplete': lessonComplete,
    'encouragement': encouragement,
  };
}

class NPC {
  const NPC({
    required this.id,
    required this.name,
    required this.description,
    required this.imageUrl,
    this.animationUrl,
    this.defaultDialogue = '',
    this.isActive = true,
    this.role = '',
    this.personality = '',
    this.skillTags = const [],
    this.programIds = const [],
    this.pathIds = const [],
    this.dialogueTemplates = const NPCDialogueTemplates(),
    this.unlockBenefit = '',
    this.accessType = AccessType.free,
  });

  final String id;
  final String name;
  final String description;
  final String imageUrl;
  final String? animationUrl;
  final String defaultDialogue;
  final bool isActive;
  final String role;
  final String personality;
  final List<String> skillTags;
  final List<String> programIds;
  final List<String> pathIds;
  final NPCDialogueTemplates dialogueTemplates;
  final String unlockBenefit;
  final AccessType accessType;

  factory NPC.fromMap(String id, Map<String, dynamic> map) => NPC(
    id: id,
    name: '${map['name'] ?? ''}',
    description: '${map['description'] ?? ''}',
    imageUrl: '${map['imageUrl'] ?? ''}',
    animationUrl: map['animationUrl']?.toString(),
    defaultDialogue: '${map['defaultDialogue'] ?? ''}',
    isActive: map['isActive'] != false,
    role: '${map['role'] ?? ''}',
    personality: '${map['personality'] ?? ''}',
    skillTags: readStringList(map['skillTags']),
    programIds: readStringList(map['programIds']),
    pathIds: readStringList(map['pathIds']),
    dialogueTemplates: NPCDialogueTemplates.fromMap(
      readMap(map['dialogueTemplates']),
    ),
    unlockBenefit: '${map['unlockBenefit'] ?? ''}',
    accessType: accessTypeFromString(map['accessType']),
  );

  Map<String, dynamic> toMap() => {
    'name': name,
    'description': description,
    'imageUrl': imageUrl,
    'animationUrl': animationUrl,
    'defaultDialogue': defaultDialogue,
    'isActive': isActive,
    'role': role,
    'personality': personality,
    'skillTags': skillTags,
    'programIds': programIds,
    'pathIds': pathIds,
    'dialogueTemplates': dialogueTemplates.toMap(),
    'unlockBenefit': unlockBenefit,
    'accessType': accessType.name.toUpperCase(),
  };

  NPC copyWith({
    String? name,
    String? imageUrl,
    String? description,
    bool? isActive,
    String? role,
    String? personality,
    List<String>? skillTags,
    List<String>? programIds,
    List<String>? pathIds,
    NPCDialogueTemplates? dialogueTemplates,
    String? unlockBenefit,
    AccessType? accessType,
  }) => NPC(
    id: id,
    name: name ?? this.name,
    description: description ?? this.description,
    imageUrl: imageUrl ?? this.imageUrl,
    animationUrl: animationUrl,
    defaultDialogue: defaultDialogue,
    isActive: isActive ?? this.isActive,
    role: role ?? this.role,
    personality: personality ?? this.personality,
    skillTags: skillTags ?? this.skillTags,
    programIds: programIds ?? this.programIds,
    pathIds: pathIds ?? this.pathIds,
    dialogueTemplates: dialogueTemplates ?? this.dialogueTemplates,
    unlockBenefit: unlockBenefit ?? this.unlockBenefit,
    accessType: accessType ?? this.accessType,
  );
}
