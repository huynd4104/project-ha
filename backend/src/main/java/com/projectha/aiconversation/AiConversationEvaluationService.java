package com.projectha.aiconversation;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class AiConversationEvaluationService {
    public AiConversationEvaluationOutcome evaluate(AiConversationQuestion question, String transcript) {
        String normalized = normalize(transcript);
        if (normalized.isBlank()) {
            return outcome(AiConversationEvaluationResult.UNCLEAR, 0, normalized, feedback(question, AiConversationEvaluationResult.UNCLEAR));
        }

        return switch (question.evaluationType()) {
            case EXACT -> evaluateExact(question, normalized);
            case KEYWORD -> evaluateKeyword(question, normalized);
            case SEMANTIC -> evaluateSemantic(question, normalized);
            case OPEN_ENDED -> evaluateOpenEnded(question, normalized);
        };
    }

    public String normalize(String value) {
        String text = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
            .replace('đ', 'd')
            .replace('Đ', 'D')
            .toLowerCase(Locale.ROOT)
            .replaceAll("[\\p{Punct}]", " ")
            .trim();
        return text.replaceAll("\\s+", " ");
    }

    private AiConversationEvaluationOutcome evaluateExact(AiConversationQuestion question, String normalized) {
        List<String> answers = new ArrayList<>();
        answers.add(question.expectedAnswer());
        answers.addAll(question.alternativeAnswers());
        boolean correct = answers.stream().map(this::normalize).filter(s -> !s.isBlank()).anyMatch(normalized::equals);
        if (correct) return outcome(AiConversationEvaluationResult.CORRECT, 1, normalized, feedback(question, AiConversationEvaluationResult.CORRECT));
        boolean near = answers.stream().map(this::normalize).filter(s -> !s.isBlank()).anyMatch(answer -> closeEnough(normalized, answer));
        if (near) return outcome(AiConversationEvaluationResult.PARTIALLY_CORRECT, 0.6, normalized, feedback(question, AiConversationEvaluationResult.PARTIALLY_CORRECT));
        return outcome(AiConversationEvaluationResult.INCORRECT, 0, normalized, feedback(question, AiConversationEvaluationResult.INCORRECT));
    }

    private AiConversationEvaluationOutcome evaluateKeyword(AiConversationQuestion question, String normalized) {
        List<String> keywords = question.acceptedKeywords().stream().map(this::normalize).filter(s -> !s.isBlank()).toList();
        if (keywords.isEmpty() && !question.expectedAnswer().isBlank()) {
            keywords = List.of(normalize(question.expectedAnswer()));
        }
        boolean correct = keywords.stream().anyMatch(normalized::contains);
        if (correct) return outcome(AiConversationEvaluationResult.CORRECT, 1, normalized, feedback(question, AiConversationEvaluationResult.CORRECT));
        boolean partial = keywords.stream().anyMatch(keyword -> keywordTokens(keyword).stream().anyMatch(token -> token.length() >= 3 && normalized.contains(token)));
        if (partial) return outcome(AiConversationEvaluationResult.PARTIALLY_CORRECT, 0.55, normalized, feedback(question, AiConversationEvaluationResult.PARTIALLY_CORRECT));
        return outcome(AiConversationEvaluationResult.INCORRECT, 0, normalized, feedback(question, AiConversationEvaluationResult.INCORRECT));
    }

    private AiConversationEvaluationOutcome evaluateSemantic(AiConversationQuestion question, String normalized) {
        AiConversationEvaluationOutcome keyword = evaluateKeyword(question, normalized);
        if (keyword.result() == AiConversationEvaluationResult.CORRECT || keyword.result() == AiConversationEvaluationResult.PARTIALLY_CORRECT) {
            return keyword;
        }
        if (normalized.length() >= 4) {
            return outcome(AiConversationEvaluationResult.PARTIALLY_CORRECT, 0.5, normalized, feedback(question, AiConversationEvaluationResult.PARTIALLY_CORRECT));
        }
        return keyword;
    }

    private AiConversationEvaluationOutcome evaluateOpenEnded(AiConversationQuestion question, String normalized) {
        if (normalized.length() < 2) {
            return outcome(AiConversationEvaluationResult.UNCLEAR, 0, normalized, feedback(question, AiConversationEvaluationResult.UNCLEAR));
        }
        List<String> keywords = question.acceptedKeywords().stream().map(this::normalize).filter(s -> !s.isBlank()).toList();
        if (!keywords.isEmpty() && keywords.stream().noneMatch(normalized::contains)) {
            return outcome(AiConversationEvaluationResult.PARTIALLY_CORRECT, 0.7, normalized, feedback(question, AiConversationEvaluationResult.PARTIALLY_CORRECT));
        }
        return outcome(AiConversationEvaluationResult.CORRECT, 1, normalized, feedback(question, AiConversationEvaluationResult.CORRECT));
    }

    private AiConversationEvaluationOutcome outcome(AiConversationEvaluationResult result, double score, String normalized, String feedback) {
        return new AiConversationEvaluationOutcome(result, score, normalized, feedback, result == AiConversationEvaluationResult.INCORRECT || result == AiConversationEvaluationResult.UNCLEAR);
    }

    private String feedback(AiConversationQuestion question, AiConversationEvaluationResult result) {
        return switch (result) {
            case CORRECT -> !question.positiveFeedback().isBlank() ? question.positiveFeedback() : "Giỏi lắm!";
            case PARTIALLY_CORRECT -> "Gần đúng rồi, con thử nói rõ hơn nhé.";
            case INCORRECT, UNCLEAR -> {
                String retry = !question.retryFeedback().isBlank() ? question.retryFeedback() : "Mình thử lại nhé.";
                String hint = !question.hintText().isBlank() ? " " + question.hintText() : "";
                yield retry + hint;
            }
            case SKIPPED -> "Mình chuyển sang câu tiếp theo nhé.";
        };
    }

    private boolean closeEnough(String input, String answer) {
        if (input.isBlank() || answer.isBlank()) return false;
        if (input.contains(answer) || answer.contains(input)) return true;
        int overlap = 0;
        for (String token : keywordTokens(answer)) {
            if (token.length() >= 3 && input.contains(token)) overlap++;
        }
        return overlap >= Math.max(1, keywordTokens(answer).size() / 2);
    }

    private List<String> keywordTokens(String value) {
        String clean = normalize(value);
        if (clean.isBlank()) return List.of();
        return List.of(clean.split("\\s+"));
    }
}
