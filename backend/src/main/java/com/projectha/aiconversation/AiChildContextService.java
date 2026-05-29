package com.projectha.aiconversation;

import com.projectha.child.ChildDevelopmentProfileRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AiChildContextService {
    private final JdbcTemplate jdbc;
    private final ChildDevelopmentProfileRepository profileRepository;

    public AiChildContextService(JdbcTemplate jdbc, ChildDevelopmentProfileRepository profileRepository) {
        this.jdbc = jdbc;
        this.profileRepository = profileRepository;
    }

    public Map<String, Object> getCompactChildContext(UUID childId) {
        Map<String, Object> context = new HashMap<>();
        if (childId == null) {
            return context;
        }

        List<Map<String, Object>> childRows = jdbc.queryForList(
            "SELECT display_name, age FROM children WHERE id = ?",
            childId
        );
        String childName = "bé";
        int childAgeNum = 0;
        if (!childRows.isEmpty()) {
            Object displayName = childRows.get(0).get("display_name");
            if (displayName != null) {
                childName = String.valueOf(displayName).trim();
            }
            Object ageVal = childRows.get(0).get("age");
            if (ageVal instanceof Number n) {
                childAgeNum = n.intValue();
            }
        }
        context.put("childName", childName);
        
        String childAgeStr = childAgeNum > 0 ? childAgeNum + " tuổi" : "tuổi của con";
        context.put("childAge", childAgeStr);

        Map<String, Object> profile = profileRepository.getProfileByChildId(childId);
        
        context.put("nickname", str(profile, "nickname", childName));
        context.put("communicationLevel", str(profile, "communication_level", "NORMAL"));
        context.put("comprehensionLevel", str(profile, "comprehension_level", "NORMAL"));
        context.put("favoriteToys", str(profile, "favorite_toys", ""));
        context.put("favoriteColors", str(profile, "favorite_colors", ""));
        context.put("favoriteAnimals", str(profile, "favorite_animals", ""));
        context.put("favoriteSongs", str(profile, "favorite_songs", ""));
        context.put("favoriteCharacters", str(profile, "favorite_characters", ""));
        context.put("preferredRewards", str(profile, "preferred_rewards", ""));
        context.put("preferredPraise", str(profile, "preferred_praise", ""));
        context.put("commonTriggers", str(profile, "common_triggers", ""));
        context.put("calmingStrategies", str(profile, "calming_strategies", ""));
        context.put("primaryCaregiver", str(profile, "primary_caregiver", ""));
        context.put("familyMembers", str(profile, "family_members", ""));

        String safetyNotes = str(profile, "safety_notes", "");
        if (!safetyNotes.isEmpty()) {
            context.put("safetyNotesSummary", safetyNotes);
        } else {
            context.put("safetyNotesSummary", "");
        }

        return context;
    }

    private static String str(Map<String, Object> map, String key, String fallback) {
        Object val = map.get(key);
        if (val == null) return fallback;
        String s = String.valueOf(val).trim();
        return s.isEmpty() ? fallback : s;
    }
}
