package com.projectha.aiconversation;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.regex.Pattern;

public class AiConversationTemplateResolver {

    private static final Pattern CHILD_NAME_PATTERN = Pattern.compile("\\{(childName|name)\\}", Pattern.CASE_INSENSITIVE);
    private static final Pattern EXPECTED_ANSWER_PATTERN = Pattern.compile("\\{expectedAnswer\\}", Pattern.CASE_INSENSITIVE);
    private static final Pattern CHILD_AGE_PATTERN = Pattern.compile("\\{childAge\\}", Pattern.CASE_INSENSITIVE);
    private static final Pattern NICKNAME_PATTERN = Pattern.compile("\\{nickname\\}", Pattern.CASE_INSENSITIVE);
    private static final Pattern FAVORITE_COLOR_PATTERN = Pattern.compile("\\{favoriteColor\\}", Pattern.CASE_INSENSITIVE);
    private static final Pattern FAVORITE_ANIMAL_PATTERN = Pattern.compile("\\{favoriteAnimal\\}", Pattern.CASE_INSENSITIVE);
    private static final Pattern FAVORITE_TOY_PATTERN = Pattern.compile("\\{favoriteToy\\}", Pattern.CASE_INSENSITIVE);
    private static final Pattern FAVORITE_SONG_PATTERN = Pattern.compile("\\{favoriteSong\\}", Pattern.CASE_INSENSITIVE);
    private static final Pattern PRIMARY_CAREGIVER_PATTERN = Pattern.compile("\\{primaryCaregiver\\}", Pattern.CASE_INSENSITIVE);
    private static final Pattern FAMILY_MEMBERS_PATTERN = Pattern.compile("\\{familyMembers\\}", Pattern.CASE_INSENSITIVE);

    private static final Pattern RAW_PLACEHOLDER_PATTERN = Pattern.compile("\\[tên của con\\]|\\.\\.\\.", Pattern.CASE_INSENSITIVE);

    public static boolean isFullyResolved(String template, Map<String, Object> childContext, String expectedAnswer) {
        if (template == null) {
            return true;
        }
        String childName = childContext != null ? (String) childContext.get("childName") : null;
        if (CHILD_NAME_PATTERN.matcher(template).find() && (childName == null || childName.isBlank())) {
            return false;
        }
        if (EXPECTED_ANSWER_PATTERN.matcher(template).find() && (expectedAnswer == null || expectedAnswer.isBlank())) {
            return false;
        }
        if (CHILD_AGE_PATTERN.matcher(template).find() && (childContext == null || isBlank(childContext.get("childAge")))) {
            return false;
        }
        if (NICKNAME_PATTERN.matcher(template).find() && (childContext == null || isBlank(childContext.get("nickname")))) {
            return false;
        }
        if (FAVORITE_COLOR_PATTERN.matcher(template).find() && (childContext == null || isBlank(childContext.get("favoriteColors")))) {
            return false;
        }
        if (FAVORITE_ANIMAL_PATTERN.matcher(template).find() && (childContext == null || isBlank(childContext.get("favoriteAnimals")))) {
            return false;
        }
        if (FAVORITE_TOY_PATTERN.matcher(template).find() && (childContext == null || isBlank(childContext.get("favoriteToys")))) {
            return false;
        }
        if (FAVORITE_SONG_PATTERN.matcher(template).find() && (childContext == null || isBlank(childContext.get("favoriteSongs")))) {
            return false;
        }
        if (PRIMARY_CAREGIVER_PATTERN.matcher(template).find() && (childContext == null || isBlank(childContext.get("primaryCaregiver")))) {
            return false;
        }
        if (FAMILY_MEMBERS_PATTERN.matcher(template).find() && (childContext == null || isBlank(childContext.get("familyMembers")))) {
            return false;
        }

        return !RAW_PLACEHOLDER_PATTERN.matcher(template).find();
    }

    private static boolean isBlank(Object obj) {
        if (obj == null) return true;
        return String.valueOf(obj).trim().isBlank();
    }

    public static boolean isFullyResolved(String template, String childName, String expectedAnswer) {
        Map<String, Object> context = new HashMap<>();
        context.put("childName", childName);
        return isFullyResolved(template, context, expectedAnswer);
    }

    public static String resolve(String template, Map<String, Object> childContext, String expectedAnswer) {
        if (template == null) {
            return "";
        }
        String resolved = template;

        String childName = childContext != null ? (String) childContext.get("childName") : null;
        if (childName != null && !childName.isBlank()) {
            resolved = CHILD_NAME_PATTERN.matcher(resolved).replaceAll(childName);
        }

        if (expectedAnswer != null && !expectedAnswer.isBlank()) {
            resolved = EXPECTED_ANSWER_PATTERN.matcher(resolved).replaceAll(expectedAnswer);
        }

        if (childContext != null) {
            resolved = CHILD_AGE_PATTERN.matcher(resolved).replaceAll(str(childContext, "childAge", "tuổi của con"));
            resolved = NICKNAME_PATTERN.matcher(resolved).replaceAll(str(childContext, "nickname", "bé"));
            resolved = FAVORITE_COLOR_PATTERN.matcher(resolved).replaceAll(getFirstValue(str(childContext, "favoriteColors", ""), "màu bé thích"));
            resolved = FAVORITE_ANIMAL_PATTERN.matcher(resolved).replaceAll(getFirstValue(str(childContext, "favoriteAnimals", ""), "con vật bé thích"));
            resolved = FAVORITE_TOY_PATTERN.matcher(resolved).replaceAll(getFirstValue(str(childContext, "favoriteToys", ""), "đồ chơi bé thích"));
            resolved = FAVORITE_SONG_PATTERN.matcher(resolved).replaceAll(getFirstValue(str(childContext, "favoriteSongs", ""), "bài hát bé thích"));
            resolved = PRIMARY_CAREGIVER_PATTERN.matcher(resolved).replaceAll(str(childContext, "primaryCaregiver", "người chăm sóc"));
            resolved = FAMILY_MEMBERS_PATTERN.matcher(resolved).replaceAll(str(childContext, "familyMembers", "gia đình"));
        }

        return sanitize(resolved);
    }

    public static String resolve(String template, String childName, String expectedAnswer) {
        Map<String, Object> context = new HashMap<>();
        context.put("childName", childName);
        return resolve(template, context, expectedAnswer);
    }

    public static List<String> resolveList(List<String> templates, Map<String, Object> childContext, String expectedAnswer) {
        if (templates == null) {
            return List.of();
        }
        List<String> resolvedList = new ArrayList<>();
        for (String t : templates) {
            resolvedList.add(resolve(t, childContext, expectedAnswer));
        }
        return resolvedList;
    }

    public static List<String> resolveList(List<String> templates, String childName, String expectedAnswer) {
        Map<String, Object> context = new HashMap<>();
        context.put("childName", childName);
        return resolveList(templates, context, expectedAnswer);
    }

    public static String sanitize(String text) {
        if (text == null) {
            return "";
        }
        String cleaned = CHILD_NAME_PATTERN.matcher(text).replaceAll("");
        cleaned = EXPECTED_ANSWER_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = CHILD_AGE_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = NICKNAME_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = FAVORITE_COLOR_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = FAVORITE_ANIMAL_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = FAVORITE_TOY_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = FAVORITE_SONG_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = PRIMARY_CAREGIVER_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = FAMILY_MEMBERS_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = RAW_PLACEHOLDER_PATTERN.matcher(cleaned).replaceAll("");

        cleaned = cleaned.replaceAll("\\s+", " ").trim();
        return cleaned;
    }

    public static boolean hasUnresolvedPlaceholders(String text) {
        if (text == null) {
            return false;
        }
        return CHILD_NAME_PATTERN.matcher(text).find() ||
               EXPECTED_ANSWER_PATTERN.matcher(text).find() ||
               CHILD_AGE_PATTERN.matcher(text).find() ||
               NICKNAME_PATTERN.matcher(text).find() ||
               FAVORITE_COLOR_PATTERN.matcher(text).find() ||
               FAVORITE_ANIMAL_PATTERN.matcher(text).find() ||
               FAVORITE_TOY_PATTERN.matcher(text).find() ||
               FAVORITE_SONG_PATTERN.matcher(text).find() ||
               PRIMARY_CAREGIVER_PATTERN.matcher(text).find() ||
               FAMILY_MEMBERS_PATTERN.matcher(text).find() ||
               RAW_PLACEHOLDER_PATTERN.matcher(text).find();
    }

    private static String getFirstValue(String text, String fallback) {
        if (text == null || text.isBlank()) {
            return fallback;
        }
        String[] parts = text.split("\n|,|;");
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                return trimmed;
            }
        }
        return fallback;
    }

    private static String str(Map<String, Object> map, String key, String fallback) {
        Object val = map.get(key);
        if (val == null) return fallback;
        String s = String.valueOf(val).trim();
        return s.isEmpty() ? fallback : s;
    }
}
