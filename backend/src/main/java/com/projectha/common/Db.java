package com.projectha.common;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class Db {
    private static final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    private Db() {}

    public static String snake(String input) {
        if (input == null || input.isBlank()) return input;
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            if (Character.isUpperCase(c)) {
                if (i > 0) out.append('_');
                out.append(Character.toLowerCase(c));
            } else if (c == '-') {
                out.append('_');
            } else {
                out.append(c);
            }
        }
        return out.toString();
    }

    public static String camel(String input) {
        if (input == null) return null;
        StringBuilder out = new StringBuilder();
        boolean upperNext = false;
        for (char c : input.toCharArray()) {
            if (c == '_') {
                upperNext = true;
            } else if (upperNext) {
                out.append(Character.toUpperCase(c));
                upperNext = false;
            } else {
                out.append(c);
            }
        }
        return out.toString();
    }

    public static Map<String, Object> row(Map<String, Object> raw) {
        Map<String, Object> out = new LinkedHashMap<>();
        raw.forEach((key, value) -> out.put(camel(key), normalize(value)));
        if (out.containsKey("primaryRole") && !out.containsKey("role")) {
            out.put("role", out.get("primaryRole"));
        }
        return out;
    }

    public static List<Map<String, Object>> rows(List<Map<String, Object>> raw) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> item : raw) out.add(row(item));
        return out;
    }

    @SuppressWarnings("unchecked")
    public static Object normalize(Object value) {
        if (value == null) return null;
        if (value instanceof UUID uuid) return uuid.toString();
        if (value instanceof Timestamp ts) return ts.toInstant().toString();
        if (value instanceof OffsetDateTime odt) return odt.toString();
        if (value instanceof LocalDate date) return date.toString();
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> out = new LinkedHashMap<>();
            map.forEach((k, v) -> out.put(String.valueOf(k), normalize(v)));
            return out;
        }
        if (value instanceof List<?> list) {
            return list.stream().map(Db::normalize).toList();
        }
        String className = value.getClass().getName();
        if (className.equals("org.postgresql.util.PGobject")) {
            String text = value.toString();
            if (text.startsWith("{")) return fromJson(text, new TypeReference<Map<String, Object>>() {});
            if (text.startsWith("[")) return fromJson(text, new TypeReference<List<Object>>() {});
        }
        return value;
    }

    public static String json(Object value) {
        try {
            return mapper.writeValueAsString(value == null ? Map.of() : value);
        } catch (Exception e) {
            throw new BadRequestException("JSON payload không hợp lệ.");
        }
    }

    public static <T> T fromJson(String json, TypeReference<T> type) {
        try {
            return mapper.readValue(json, type);
        } catch (Exception e) {
            throw new BadRequestException("JSON payload không hợp lệ.");
        }
    }
}
