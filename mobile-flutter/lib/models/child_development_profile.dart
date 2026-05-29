class ChildDevelopmentProfile {
  const ChildDevelopmentProfile({
    required this.childId,
    this.nickname = '',
    this.favoriteColors = '',
    this.favoriteAnimals = '',
    this.favoriteToys = '',
    this.favoriteSongs = '',
    this.favoriteActivities = '',
    this.preferredPraise = '',
    this.primaryCaregiver = '',
    this.familyMembers = '',
    this.communicationLevel = 'Chưa nói',
    this.commonTriggers = '',
    this.calmingStrategies = '',
  });

  final String childId;
  final String nickname;
  final String favoriteColors;
  final String favoriteAnimals;
  final String favoriteToys;
  final String favoriteSongs;
  final String favoriteActivities;
  final String preferredPraise;
  final String primaryCaregiver;
  final String familyMembers;
  final String communicationLevel;
  final String commonTriggers;
  final String calmingStrategies;

  factory ChildDevelopmentProfile.fromMap(Map<String, dynamic> map) {
    return ChildDevelopmentProfile(
      childId: '${map['childId'] ?? map['child_id'] ?? ''}',
      nickname: '${map['nickname'] ?? ''}',
      favoriteColors: '${map['favoriteColors'] ?? map['favorite_colors'] ?? ''}',
      favoriteAnimals: '${map['favoriteAnimals'] ?? map['favorite_animals'] ?? ''}',
      favoriteToys: '${map['favoriteToys'] ?? map['favorite_toys'] ?? ''}',
      favoriteSongs: '${map['favoriteSongs'] ?? map['favorite_songs'] ?? ''}',
      favoriteActivities: '${map['favoriteActivities'] ?? map['favorite_activities'] ?? ''}',
      preferredPraise: '${map['preferredPraise'] ?? map['preferred_praise'] ?? ''}',
      primaryCaregiver: '${map['primaryCaregiver'] ?? map['primary_caregiver'] ?? ''}',
      familyMembers: '${map['familyMembers'] ?? map['family_members'] ?? ''}',
      communicationLevel: '${map['communicationLevel'] ?? map['communication_level'] ?? 'Chưa nói'}',
      commonTriggers: '${map['commonTriggers'] ?? map['common_triggers'] ?? map['fearsOrSensitivities'] ?? map['fears_or_sensitivities'] ?? ''}',
      calmingStrategies: '${map['calmingStrategies'] ?? map['calming_strategies'] ?? ''}',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'childId': childId,
      'nickname': nickname,
      'favoriteColors': favoriteColors,
      'favoriteAnimals': favoriteAnimals,
      'favoriteToys': favoriteToys,
      'favoriteSongs': favoriteSongs,
      'favoriteActivities': favoriteActivities,
      'preferredPraise': preferredPraise,
      'primaryCaregiver': primaryCaregiver,
      'familyMembers': familyMembers,
      'communicationLevel': communicationLevel,
      'commonTriggers': commonTriggers,
      'calmingStrategies': calmingStrategies,
    };
  }

  ChildDevelopmentProfile copyWith({
    String? nickname,
    String? favoriteColors,
    String? favoriteAnimals,
    String? favoriteToys,
    String? favoriteSongs,
    String? favoriteActivities,
    String? preferredPraise,
    String? primaryCaregiver,
    String? familyMembers,
    String? communicationLevel,
    String? commonTriggers,
    String? calmingStrategies,
  }) {
    return ChildDevelopmentProfile(
      childId: childId,
      nickname: nickname ?? this.nickname,
      favoriteColors: favoriteColors ?? this.favoriteColors,
      favoriteAnimals: favoriteAnimals ?? this.favoriteAnimals,
      favoriteToys: favoriteToys ?? this.favoriteToys,
      favoriteSongs: favoriteSongs ?? this.favoriteSongs,
      favoriteActivities: favoriteActivities ?? this.favoriteActivities,
      preferredPraise: preferredPraise ?? this.preferredPraise,
      primaryCaregiver: primaryCaregiver ?? this.primaryCaregiver,
      familyMembers: familyMembers ?? this.familyMembers,
      communicationLevel: communicationLevel ?? this.communicationLevel,
      commonTriggers: commonTriggers ?? this.commonTriggers,
      calmingStrategies: calmingStrategies ?? this.calmingStrategies,
    );
  }
}
