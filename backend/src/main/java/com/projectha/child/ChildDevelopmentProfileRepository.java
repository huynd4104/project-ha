package com.projectha.child;

import com.projectha.common.Db;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ChildDevelopmentProfileRepository {
    private final JdbcTemplate jdbc;

    public ChildDevelopmentProfileRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> getProfileByChildId(UUID childId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT * FROM child_development_profiles WHERE child_id = ?",
            childId
        );
        if (rows.isEmpty()) {
            Map<String, Object> defaultProfile = new HashMap<>();
            defaultProfile.put("childId", childId.toString());
            defaultProfile.put("consentToUseForAi", true);
            return defaultProfile;
        }
        return Db.row(rows.get(0));
    }

    public Map<String, Object> upsertProfile(UUID childId, Map<String, Object> payload) {
        jdbc.update("""
            INSERT INTO child_development_profiles (
                child_id, nickname, primary_language, communication_level, comprehension_level, attention_span_level,
                gross_motor_level, fine_motor_level, self_care_level,
                need_expression_style, common_triggers, calming_strategies, eye_contact_level, social_interaction_level,
                favorite_toys, favorite_colors, favorite_animals, favorite_songs, favorite_characters, favorite_foods, favorite_activities,
                preferred_rewards, preferred_praise, strengths, fears_or_sensitivities,
                primary_caregiver, family_members, sibling_names, home_rules, home_notes,
                hearing_vision_notes, health_notes, medication_notes, safety_notes,
                consent_to_use_for_ai
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?
            )
            ON CONFLICT (child_id) DO UPDATE SET
                nickname = EXCLUDED.nickname,
                primary_language = EXCLUDED.primary_language,
                communication_level = EXCLUDED.communication_level,
                comprehension_level = EXCLUDED.comprehension_level,
                attention_span_level = EXCLUDED.attention_span_level,
                gross_motor_level = EXCLUDED.gross_motor_level,
                fine_motor_level = EXCLUDED.fine_motor_level,
                self_care_level = EXCLUDED.self_care_level,
                need_expression_style = EXCLUDED.need_expression_style,
                common_triggers = EXCLUDED.common_triggers,
                calming_strategies = EXCLUDED.calming_strategies,
                eye_contact_level = EXCLUDED.eye_contact_level,
                social_interaction_level = EXCLUDED.social_interaction_level,
                favorite_toys = EXCLUDED.favorite_toys,
                favorite_colors = EXCLUDED.favorite_colors,
                favorite_animals = EXCLUDED.favorite_animals,
                favorite_songs = EXCLUDED.favorite_songs,
                favorite_characters = EXCLUDED.favorite_characters,
                favorite_foods = EXCLUDED.favorite_foods,
                favorite_activities = EXCLUDED.favorite_activities,
                preferred_rewards = EXCLUDED.preferred_rewards,
                preferred_praise = EXCLUDED.preferred_praise,
                strengths = EXCLUDED.strengths,
                fears_or_sensitivities = EXCLUDED.fears_or_sensitivities,
                primary_caregiver = EXCLUDED.primary_caregiver,
                family_members = EXCLUDED.family_members,
                sibling_names = EXCLUDED.sibling_names,
                home_rules = EXCLUDED.home_rules,
                home_notes = EXCLUDED.home_notes,
                hearing_vision_notes = EXCLUDED.hearing_vision_notes,
                health_notes = EXCLUDED.health_notes,
                medication_notes = EXCLUDED.medication_notes,
                safety_notes = EXCLUDED.safety_notes,
                consent_to_use_for_ai = EXCLUDED.consent_to_use_for_ai,
                updated_at = now()
            """,
            childId,
            str(payload, "nickname", null),
            str(payload, "primaryLanguage", null),
            str(payload, "communicationLevel", null),
            str(payload, "comprehensionLevel", null),
            str(payload, "attentionSpanLevel", null),
            str(payload, "grossMotorLevel", null),
            str(payload, "fineMotorLevel", null),
            str(payload, "selfCareLevel", null),
            str(payload, "needExpressionStyle", null),
            str(payload, "commonTriggers", null),
            str(payload, "calmingStrategies", null),
            str(payload, "eyeContactLevel", null),
            str(payload, "socialInteractionLevel", null),
            str(payload, "favoriteToys", null),
            str(payload, "favoriteColors", null),
            str(payload, "favoriteAnimals", null),
            str(payload, "favoriteSongs", null),
            str(payload, "favoriteCharacters", null),
            str(payload, "favoriteFoods", null),
            str(payload, "favoriteActivities", null),
            str(payload, "preferredRewards", null),
            str(payload, "preferredPraise", null),
            str(payload, "strengths", null),
            str(payload, "fearsOrSensitivities", null),
            str(payload, "primaryCaregiver", null),
            str(payload, "familyMembers", null),
            str(payload, "siblingNames", null),
            str(payload, "homeRules", null),
            str(payload, "homeNotes", null),
            str(payload, "hearingVisionNotes", null),
            str(payload, "healthNotes", null),
            str(payload, "medicationNotes", null),
            str(payload, "safetyNotes", null),
            bool(payload, "consentToUseForAi", true)
        );
        return getProfileByChildId(childId);
    }

    private static String str(Map<String, Object> map, String key, String fallback) {
        Object value = map.get(key);
        if (value == null) return fallback;
        String s = String.valueOf(value).trim();
        return s.isEmpty() ? fallback : s;
    }

    private static Boolean bool(Map<String, Object> map, String key, Boolean fallback) {
        Object value = map.get(key);
        if (value instanceof Boolean b) return b;
        if (value == null) return fallback;
        return Boolean.parseBoolean(String.valueOf(value));
    }
}
