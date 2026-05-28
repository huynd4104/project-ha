package com.projectha.aiconversation;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AiConversationEvaluationService {
    private static final Logger log = LoggerFactory.getLogger(AiConversationEvaluationService.class);

    private final GeminiEvaluationService geminiEvaluationService;

    public AiConversationEvaluationService(GeminiEvaluationService geminiEvaluationService) {
        this.geminiEvaluationService = geminiEvaluationService;
    }

    /**
     * MAIN ENTRY: Evaluate a transcript against a question.
     * Flow:
     *  1. Normalize
     *  2. Check "Don't know" HARD RULE (before Gemini)
     *  3. Evaluate by type (Gemini may be called inside SEMANTIC)
     *  4. Override: re-check "Don't know" AFTER Gemini (in case Gemini returns PARTIALLY_CORRECT)
     */
    public AiConversationEvaluationOutcome evaluate(AiConversationQuestion question, String transcript) {
        String normalized = normalize(transcript);

        // Blank transcript → UNCLEAR
        if (normalized.isBlank()) {
            return buildOutcome(
                AiConversationEvaluationResult.UNCLEAR, 0.0, normalized,
                question, false, "LOCAL", "BLANK_TRANSCRIPT"
            );
        }

        // ── STEP 1: Hard rule "Don't know" — run BEFORE Gemini ──
        if (isDontKnowAnswer(transcript, normalized)) {
            return buildDontKnowOutcome(question, normalized, "DONT_KNOW_HARD_RULE_BEFORE_GEMINI");
        }

        // ── STEP 2: Evaluate by evaluation type ──
        AiConversationEvaluationOutcome outcome;
        switch (question.evaluationType()) {
            case EXACT -> outcome = evaluateExact(question, normalized);
            case KEYWORD -> outcome = evaluateKeyword(question, normalized);
            case SEMANTIC -> outcome = evaluateSemantic(question, normalized);
            case OPEN_ENDED -> outcome = evaluateOpenEnded(question, normalized);
            default -> outcome = buildOutcome(
                AiConversationEvaluationResult.UNCLEAR, 0.0, normalized,
                question, false, "LOCAL", "UNKNOWN_EVALUATION_TYPE"
            );
        }

        // ── STEP 3: Override AFTER Gemini — safety net ──
        if (isDontKnowAnswer(transcript, normalized)) {
            if (outcome.result() == AiConversationEvaluationResult.PARTIALLY_CORRECT
                || outcome.result() == AiConversationEvaluationResult.CORRECT) {
                log.info("[Evaluation] Overriding {} to INCORRECT for 'Don't know' answer (questionId={})",
                    outcome.result(), question.id());
                return buildDontKnowOutcome(question, normalized, "DONT_KNOW_HARD_RULE_OVERRIDE_AFTER_GEMINI");
            }
        }

        return outcome;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  HARD RULE: "Don't know" answer detection
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Detect "Don't know" answers in Vietnamese.
     * This is a HARD rule — these answers are NEVER PARTIALLY_CORRECT or CORRECT.
     *
     * Covers:
     *  - "không biết"
     *  - "con không biết", "em không biết", "cháu không biết"
     *  - "không ạ", "không"
     *  - "chịu", "con chịu", "em chịu"
     *  - Empty / too short (after normalization)
     */
    private boolean isDontKnowAnswer(String rawTranscript, String normalized) {
        if (normalized == null || normalized.isBlank()) return true;

        // Strip common prefixes like "con", "em", "cháu", "chị"
        String stripped = normalized
            .replaceAll("^(con|em|ch\\u00e1u|ch\\u1ecb)\\s+", "")
            .trim();

        // Exact or near-exact matches
        List<String> dontKnowPatterns = List.of(
            "khong biet",
            "khong",
            "khong a",
            "chiu",
            "kh hiet",
            "khong hiet",
            "khong biet a",
            "chua biet",
            "chua hieu",
            "chua nghe ro",
            "hong biet",
            "hk biet",
            "kbiet"
        );

        for (String pattern : dontKnowPatterns) {
            if (stripped.equals(pattern) || normalized.equals(pattern)) {
                return true;
            }
        }

        // Fallback: if the transcript is very short and contains "khong" or "chua"
        // (e.g., "không có", "không ạ", "chưa") → treat as don't-know
        if (stripped.length() <= 8) {
            if (stripped.startsWith("khong") || stripped.startsWith("chua") || stripped.equals("hong")) {
                return true;
            }
        }

        return false;
    }

    /**
     * Build the standard "Don't know" outcome.
     * Result: INCORRECT, Score: 0.1, Feedback: suggestion to try the expected answer.
     */
    private AiConversationEvaluationOutcome buildDontKnowOutcome(
        AiConversationQuestion question, String normalized, String reason
    ) {
        String expectedAnswer = question.expectedAnswer() != null ? question.expectedAnswer().trim() : "";
        String feedback;
        String suggestedRetryText;

        if (!expectedAnswer.isEmpty()) {
            feedback = "Không sao đâu, con thử nói: " + expectedAnswer + " nhé.";
            suggestedRetryText = expectedAnswer;
        } else {
            feedback = "Không sao đâu, con thử nói lại nhé.";
            suggestedRetryText = "";
        }

        return new AiConversationEvaluationOutcome(
            AiConversationEvaluationResult.INCORRECT,
            0.1,
            normalized,
            feedback,
            suggestedRetryText,
            reason,
            true,
            false,    // usedGemini
            "LOCAL",  // evaluationSource
            false,    // shouldRetry  (will be overridden by AiConversationService)
            false,    // shouldAdvance
            false,    // canSkip
            "DONT_KNOW"
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Evaluation by type
    // ═══════════════════════════════════════════════════════════════════

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
        if (correct) {
            return buildOutcome(AiConversationEvaluationResult.CORRECT, 1.0, normalized,
                question, false, "LOCAL", "EXACT_MATCH");
        }
        boolean near = answers.stream().map(this::normalize).filter(s -> !s.isBlank()).anyMatch(answer -> closeEnough(normalized, answer));
        if (near) {
            return buildOutcome(AiConversationEvaluationResult.PARTIALLY_CORRECT, 0.6, normalized,
                question, false, "LOCAL", "EXACT_NEAR_MATCH");
        }
        return buildOutcome(AiConversationEvaluationResult.INCORRECT, 0.0, normalized,
            question, true, "LOCAL", "EXACT_NO_MATCH");
    }

    private AiConversationEvaluationOutcome evaluateKeyword(AiConversationQuestion question, String normalized) {
        List<String> keywords = question.acceptedKeywords().stream().map(this::normalize).filter(s -> !s.isBlank()).toList();
        if (keywords.isEmpty() && !question.expectedAnswer().isBlank()) {
            keywords = List.of(normalize(question.expectedAnswer()));
        }
        boolean correct = keywords.stream().anyMatch(normalized::contains);
        if (correct) {
            return buildOutcome(AiConversationEvaluationResult.CORRECT, 1.0, normalized,
                question, false, "LOCAL", "KEYWORD_MATCH");
        }
        boolean partial = keywords.stream().anyMatch(keyword -> keywordTokens(keyword).stream().anyMatch(token -> token.length() >= 3 && normalized.contains(token)));
        if (partial) {
            return buildOutcome(AiConversationEvaluationResult.PARTIALLY_CORRECT, 0.55, normalized,
                question, true, "LOCAL", "KEYWORD_PARTIAL");
        }
        return buildOutcome(AiConversationEvaluationResult.INCORRECT, 0.0, normalized,
            question, true, "LOCAL", "KEYWORD_NO_MATCH");
    }

    private AiConversationEvaluationOutcome evaluateSemantic(AiConversationQuestion question, String normalized) {
        boolean usedGemini = false;
        String evalSource = "LOCAL";
        String evalReason = "FALLBACK_LOCAL";

        // Try Gemini evaluation first
        if (geminiEvaluationService != null) {
            try {
                GeminiEvaluationService.GeminiEvaluationResult geminiResult = geminiEvaluationService.evaluate(question, normalized);
                if (geminiResult != null) {
                    usedGemini = true;
                    evalSource = "GEMINI";
                    evalReason = "GEMINI_SUCCESS";

                    String feedbackText = geminiResult.feedback();
                    if (feedbackText != null && !feedbackText.isBlank()) {
                        if (isEnglish(feedbackText)) {
                            feedbackText = feedback(question, geminiResult.result());
                        }
                        return buildOutcomeWithFeedback(
                            geminiResult.result(), geminiResult.score(), normalized,
                            feedbackText, geminiResult.reason(),
                            question, usedGemini, evalSource, evalReason
                        );
                    }
                }
            } catch (Exception e) {
                evalReason = "GEMINI_ERROR: " + e.getMessage();
                log.debug("Gemini evaluation failed for questionId: {}, falling back to local: {}",
                    question.id(), e.getMessage());
            }
        }

        // Fallback to local keyword evaluation
        AiConversationEvaluationOutcome keyword = evaluateKeyword(question, normalized);
        if (keyword.result() == AiConversationEvaluationResult.CORRECT || keyword.result() == AiConversationEvaluationResult.PARTIALLY_CORRECT) {
            return new AiConversationEvaluationOutcome(
                keyword.result(), keyword.score(), normalized, keyword.feedback(),
                keyword.suggestedRetryText(), evalReason, keyword.needsPractice(),
                usedGemini, evalSource, false, false, false, "LOCAL_KEYWORD"
            );
        }

        // If transcript has content (>= 4 chars), give partial credit
        if (normalized.length() >= 4) {
            return buildOutcome(AiConversationEvaluationResult.PARTIALLY_CORRECT, 0.5, normalized,
                question, true, evalSource, "LOCAL_SEMANTIC_PARTIAL");
        }

        return new AiConversationEvaluationOutcome(
            keyword.result(), keyword.score(), normalized, keyword.feedback(),
            keyword.suggestedRetryText(), evalReason, keyword.needsPractice(),
            usedGemini, evalSource, false, false, false, "LOCAL_KEYWORD_FALLBACK"
        );
    }

    private boolean isEnglish(String text) {
        if (text == null || text.isBlank()) return false;
        String lower = text.toLowerCase();
        return lower.contains("good") || lower.contains("correct") || lower.contains("try") ||
               lower.contains("again") || lower.contains("answer") || lower.contains("well");
    }

    private AiConversationEvaluationOutcome evaluateOpenEnded(AiConversationQuestion question, String normalized) {
        if (normalized.length() < 2) {
            return buildOutcome(AiConversationEvaluationResult.UNCLEAR, 0.0, normalized,
                question, false, "LOCAL", "OPEN_ENDED_TOO_SHORT");
        }
        List<String> keywords = question.acceptedKeywords().stream().map(this::normalize).filter(s -> !s.isBlank()).toList();
        if (!keywords.isEmpty() && keywords.stream().noneMatch(normalized::contains)) {
            return buildOutcome(AiConversationEvaluationResult.PARTIALLY_CORRECT, 0.7, normalized,
                question, true, "LOCAL", "OPEN_ENDED_NO_KEYWORDS");
        }
        return buildOutcome(AiConversationEvaluationResult.CORRECT, 1.0, normalized,
            question, false, "LOCAL", "OPEN_ENDED_MATCH");
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Outcome builders
    // ═══════════════════════════════════════════════════════════════════

    private AiConversationEvaluationOutcome buildOutcome(
        AiConversationEvaluationResult result, double score, String normalized,
        AiConversationQuestion question, boolean needsPractice,
        String evaluationSource, String reason
    ) {
        return new AiConversationEvaluationOutcome(
            result, score, normalized,
            feedback(question, result),
            result == AiConversationEvaluationResult.INCORRECT || result == AiConversationEvaluationResult.UNCLEAR
                ? question.expectedAnswer() : "",
            reason,
            needsPractice,
            false, // usedGemini
            evaluationSource,
            false, false, false, "" // will be set by AiConversationService
        );
    }

    private AiConversationEvaluationOutcome buildOutcomeWithFeedback(
        AiConversationEvaluationResult result, double score, String normalized,
        String feedbackText, String reason,
        AiConversationQuestion question, boolean usedGemini, String evalSource, String evalReason
    ) {
        return new AiConversationEvaluationOutcome(
            result, score, normalized,
            feedbackText,
            result == AiConversationEvaluationResult.INCORRECT || result == AiConversationEvaluationResult.UNCLEAR
                ? question.expectedAnswer() : "",
            reason,
            result == AiConversationEvaluationResult.INCORRECT || result == AiConversationEvaluationResult.UNCLEAR,
            usedGemini, evalSource,
            false, false, false, "" // will be set by AiConversationService
        );
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
