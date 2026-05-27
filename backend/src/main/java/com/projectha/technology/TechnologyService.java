package com.projectha.technology;

import com.projectha.common.Db;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class TechnologyService {
    private final JdbcTemplate jdbc;

    public TechnologyService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> numbers() {
        // Fetch items
        List<Map<String, Object>> itemRows = jdbc.queryForList(
            "SELECT * FROM number_items WHERE is_active = true ORDER BY number_value ASC"
        );
        List<Map<String, Object>> items = new ArrayList<>();

        for (Map<String, Object> row : itemRows) {
            Map<String, Object> item = Db.row(row);
            UUID itemId = (UUID) row.get("id");
            
            // Fetch examples for this item
            List<Map<String, Object>> exampleRows = jdbc.queryForList(
                "SELECT * FROM number_examples WHERE number_item_id = ? AND is_active = true ORDER BY created_at ASC",
                itemId
            );
            item.put("examples", Db.rows(exampleRows));
            items.add(item);
        }

        return items;
    }

    public List<Map<String, Object>> numberCountingQuestions() {
        return Db.rows(jdbc.queryForList(
            "SELECT * FROM number_counting_questions WHERE is_active = true ORDER BY created_at ASC"
        ));
    }

    public List<Map<String, Object>> shapes() {
        // Fetch items
        List<Map<String, Object>> itemRows = jdbc.queryForList(
            "SELECT * FROM shape_items WHERE is_active = true ORDER BY shape_name ASC"
        );
        List<Map<String, Object>> items = new ArrayList<>();

        for (Map<String, Object> row : itemRows) {
            Map<String, Object> item = Db.row(row);
            UUID itemId = (UUID) row.get("id");
            
            // Fetch examples for this item
            List<Map<String, Object>> exampleRows = jdbc.queryForList(
                "SELECT * FROM shape_examples WHERE shape_item_id = ? AND is_active = true ORDER BY created_at ASC",
                itemId
            );
            item.put("examples", Db.rows(exampleRows));
            items.add(item);
        }

        return items;
    }

    public List<Map<String, Object>> shapeRecognitionQuestions() {
        return Db.rows(jdbc.queryForList(
            "SELECT * FROM shape_recognition_questions WHERE is_active = true ORDER BY created_at ASC"
        ));
    }

    public List<Map<String, Object>> pecs(String category) {
        if (category != null && !category.isBlank()) {
            return Db.rows(jdbc.queryForList(
                "SELECT * FROM pecs_cards WHERE is_active = true AND category = ? ORDER BY category ASC, title ASC",
                category
            ));
        } else {
            return Db.rows(jdbc.queryForList(
                "SELECT * FROM pecs_cards WHERE is_active = true ORDER BY category ASC, title ASC"
            ));
        }
    }
}
