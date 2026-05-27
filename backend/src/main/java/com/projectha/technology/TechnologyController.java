package com.projectha.technology;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/technology")
public class TechnologyController {
    private final TechnologyService service;

    public TechnologyController(TechnologyService service) {
        this.service = service;
    }

    @GetMapping("/numbers")
    public Map<String, Object> numbers() {
        return Map.of("items", service.numbers());
    }

    @GetMapping("/numbers/counting-questions")
    public Map<String, Object> numberCountingQuestions() {
        return Map.of("questions", service.numberCountingQuestions());
    }

    @GetMapping("/shapes")
    public Map<String, Object> shapes() {
        return Map.of("items", service.shapes());
    }

    @GetMapping("/shapes/recognition-questions")
    public Map<String, Object> shapeRecognitionQuestions() {
        return Map.of("questions", service.shapeRecognitionQuestions());
    }
}
