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
    public AiConversationEvaluationOutcome evaluate(AiConversationQuestion question, String transcript, AiConversationRuntimeContext context, int attemptNo) {
        String normalized = normalize(transcript);

        // Blank transcript → UNCLEAR
        if (normalized.isBlank()) {
            return buildOutcome(
                AiConversationEvaluationResult.UNCLEAR, 0.0, normalized,
                question, context, false, "LOCAL", "BLANK_TRANSCRIPT"
            );
        }

        boolean isDontKnow = isDontKnowAnswer(transcript, normalized);

        // If it is "Don't know" and it is NOT SEMANTIC (or Gemini is not enabled), run the hard rule immediately:
        boolean runGemini = (question.evaluationType() == AiConversationEvaluationType.SEMANTIC && geminiEvaluationService != null);
        if (isDontKnow && !runGemini) {
            return buildDontKnowOutcome(question, context, normalized, "DONT_KNOW_HARD_RULE_BEFORE_GEMINI");
        }

        // Evaluate by type
        AiConversationEvaluationOutcome outcome;
        switch (question.evaluationType()) {
            case EXACT -> outcome = evaluateExact(question, context, normalized);
            case KEYWORD -> outcome = evaluateKeyword(question, context, normalized);
            case SEMANTIC -> outcome = evaluateSemantic(question, context, normalized, attemptNo);
            case OPEN_ENDED -> outcome = evaluateOpenEnded(question, context, normalized);
            default -> outcome = buildOutcome(
                AiConversationEvaluationResult.UNCLEAR, 0.0, normalized,
                question, context, false, "LOCAL", "UNKNOWN_EVALUATION_TYPE"
            );
        }

        // Hard rule override after evaluation (for SEMANTIC when Gemini runs on "Don't know" or returns something else):
        if (isDontKnow) {
            log.info("[Evaluation] Overriding result to INCORRECT for 'Don't know' answer (questionId={})", question.id());
            
            // Build the local fallback feedback for "Don't know"
            AiConversationEvaluationOutcome localDontKnow = buildDontKnowOutcome(question, context, normalized, "DONT_KNOW_HARD_RULE_OVERRIDE_AFTER_GEMINI");
            
            // If Gemini was used and correctly identified incorrect/unclear, we can keep its feedback, otherwise use local fallback
            boolean geminiIsIncorrectOrUnclear = (outcome.result() == AiConversationEvaluationResult.INCORRECT || outcome.result() == AiConversationEvaluationResult.UNCLEAR);
            String feedbackText = outcome.usedGemini() && geminiIsIncorrectOrUnclear && !outcome.feedback().isBlank() ? outcome.feedback() : localDontKnow.feedback();
            String suggestedRetryText = outcome.usedGemini() && geminiIsIncorrectOrUnclear && !outcome.suggestedRetryText().isBlank() ? outcome.suggestedRetryText() : localDontKnow.suggestedRetryText();
            
            // Sanitize again to be safe
            feedbackText = AiConversationTemplateResolver.sanitize(feedbackText);
            suggestedRetryText = AiConversationTemplateResolver.sanitize(suggestedRetryText);

            // Double check fallback feedback if resolved contains raw placeholders
            if (AiConversationTemplateResolver.hasUnresolvedPlaceholders(feedbackText) || feedbackText.isBlank()) {
                feedbackText = localDontKnow.feedback();
            }
            if (AiConversationTemplateResolver.hasUnresolvedPlaceholders(suggestedRetryText)) {
                suggestedRetryText = localDontKnow.suggestedRetryText();
            }

            return new AiConversationEvaluationOutcome(
                AiConversationEvaluationResult.INCORRECT,
                0.1,
                normalized,
                feedbackText,
                suggestedRetryText,
                "DONT_KNOW_HARD_RULE_OVERRIDE_AFTER_GEMINI",
                true, // needsPractice
                outcome.usedGemini(),
                outcome.evaluationSource(),
                true, // shouldRetry
                false, // shouldAdvance
                false, // canSkip
                "DONT_KNOW"
            );
        }

        // Even for normal answers, sanitize the final outcome's feedback and suggestedRetryText
        String cleanedFeedback = AiConversationTemplateResolver.sanitize(outcome.feedback());
        String cleanedRetryText = AiConversationTemplateResolver.sanitize(outcome.suggestedRetryText());

        // If after cleaning, feedback is blank or has unresolved placeholders, use fallback
        if (cleanedFeedback.isBlank() || AiConversationTemplateResolver.hasUnresolvedPlaceholders(cleanedFeedback)) {
            cleanedFeedback = buildFallbackFeedback(question, context, outcome.result());
        }

        if (AiConversationTemplateResolver.hasUnresolvedPlaceholders(cleanedRetryText)) {
            cleanedRetryText = "";
        }

        return new AiConversationEvaluationOutcome(
            outcome.result(),
            outcome.score(),
            outcome.normalizedAnswer(),
            cleanedFeedback,
            cleanedRetryText,
            outcome.reason(),
            outcome.needsPractice(),
            outcome.usedGemini(),
            outcome.evaluationSource(),
            outcome.shouldRetry(),
            outcome.shouldAdvance(),
            outcome.canSkip(),
            outcome.advanceReason()
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  HARD RULE: "Don't know" answer detection
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Detect "Don't know" answers in Vietnamese.
     * This is a HARD rule — these answers are NEVER PARTIALLY_CORRECT or CORRECT.
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

        if (stripped.length() <= 8) {
            if (stripped.startsWith("khong") || stripped.startsWith("chua") || stripped.equals("hong")) {
                return true;
            }
        }

        return false;
    }

    private boolean isNameQuestion(AiConversationQuestion question) {
        String qText = question.questionText().toLowerCase();
        String expected = question.expectedAnswer().toLowerCase();
        return qText.contains("tên là gì") || qText.contains("tên con") || qText.contains("tên của con") ||
               expected.contains("{childname}") || expected.contains("{name}");
    }

    /**
     * Build the standard "Don't know" outcome.
     * Result: INCORRECT, Score: 0.1, Feedback: suggestion to try the expected answer.
     */
    private AiConversationEvaluationOutcome buildDontKnowOutcome(
        AiConversationQuestion question, AiConversationRuntimeContext context, String normalized, String reason
    ) {
        String expectedAnswerResolved = context.expectedAnswerResolved() != null ? context.expectedAnswerResolved().trim() : "";
        String feedback;
        String suggestedRetryText;

        if (!expectedAnswerResolved.isEmpty() && !AiConversationTemplateResolver.hasUnresolvedPlaceholders(expectedAnswerResolved)) {
            feedback = "Không sao đâu, con nói cùng mình: " + expectedAnswerResolved + " nhé.";
            suggestedRetryText = expectedAnswerResolved;
        } else {
            if (isNameQuestion(question)) {
                feedback = "Con thử nói tên của con nhé.";
            } else {
                feedback = "Con thử nói lại theo cách của con nhé.";
            }
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
            true,    // shouldRetry
            false,    // shouldAdvance
            false,    // canSkip
            "DONT_KNOW"
        );
    }

    private String buildFallbackFeedback(AiConversationQuestion question, AiConversationRuntimeContext context, AiConversationEvaluationResult result) {
        if (result == AiConversationEvaluationResult.CORRECT) {
            return "Giỏi lắm!";
        } else if (result == AiConversationEvaluationResult.INCORRECT || result == AiConversationEvaluationResult.UNCLEAR || result == AiConversationEvaluationResult.PARTIALLY_CORRECT) {
            String expectedResolved = context.expectedAnswerResolved() != null ? context.expectedAnswerResolved().trim() : "";
            if (!expectedResolved.isEmpty() && !AiConversationTemplateResolver.hasUnresolvedPlaceholders(expectedResolved)) {
                return "Không sao đâu, con nói cùng mình: " + expectedResolved + " nhé.";
            } else {
                return "Không sao đâu, con thử nói lại theo cách của con nhé.";
            }
        } else if (result == AiConversationEvaluationResult.SKIPPED) {
            return "Mình chuyển sang câu tiếp theo nhé.";
        }
        return "Con thử nói lại nhé.";
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

    private AiConversationEvaluationOutcome evaluateExact(AiConversationQuestion question, AiConversationRuntimeContext context, String normalized) {
        List<String> answers = new ArrayList<>();
        if (context.expectedAnswerResolved() != null && !context.expectedAnswerResolved().isBlank()) {
            answers.add(context.expectedAnswerResolved());
        }
        if (context.alternativeAnswersResolved() != null) {
            answers.addAll(context.alternativeAnswersResolved());
        }
        
        boolean correct = answers.stream().map(this::normalize).filter(s -> !s.isBlank()).anyMatch(normalized::equals);
        if (correct) {
            return buildOutcome(AiConversationEvaluationResult.CORRECT, 1.0, normalized,
                question, context, false, "LOCAL", "EXACT_MATCH");
        }
        boolean near = answers.stream().map(this::normalize).filter(s -> !s.isBlank()).anyMatch(answer -> closeEnough(normalized, answer));
        if (near) {
            return buildOutcome(AiConversationEvaluationResult.PARTIALLY_CORRECT, 0.6, normalized,
                question, context, false, "LOCAL", "EXACT_NEAR_MATCH");
        }
        return buildOutcome(AiConversationEvaluationResult.INCORRECT, 0.0, normalized,
            question, context, true, "LOCAL", "EXACT_NO_MATCH");
    }

    private AiConversationEvaluationOutcome evaluateKeyword(AiConversationQuestion question, AiConversationRuntimeContext context, String normalized) {
        List<String> keywords = context.acceptedKeywordsResolved() != null ? context.acceptedKeywordsResolved() : List.of();
        keywords = keywords.stream().map(this::normalize).filter(s -> !s.isBlank()).toList();
        
        if (keywords.isEmpty() && context.expectedAnswerResolved() != null && !context.expectedAnswerResolved().isBlank()) {
            keywords = List.of(normalize(context.expectedAnswerResolved()));
        }
        boolean correct = keywords.stream().anyMatch(normalized::contains);
        if (correct) {
            return buildOutcome(AiConversationEvaluationResult.CORRECT, 1.0, normalized,
                question, context, false, "LOCAL", "KEYWORD_MATCH");
        }
        boolean partial = keywords.stream().anyMatch(keyword -> keywordTokens(keyword).stream().anyMatch(token -> token.length() >= 3 && normalized.contains(token)));
        if (partial) {
            return buildOutcome(AiConversationEvaluationResult.PARTIALLY_CORRECT, 0.55, normalized,
                question, context, true, "LOCAL", "KEYWORD_PARTIAL");
        }
        return buildOutcome(AiConversationEvaluationResult.INCORRECT, 0.0, normalized,
            question, context, true, "LOCAL", "KEYWORD_NO_MATCH");
    }

    private AiConversationEvaluationOutcome evaluateSemantic(AiConversationQuestion question, AiConversationRuntimeContext context, String normalized, int attemptNo) {
        boolean usedGemini = false;
        String evalSource = "LOCAL";
        String evalReason = "FALLBACK_LOCAL";

        // Try Gemini evaluation first
        if (geminiEvaluationService != null) {
            try {
                GeminiEvaluationService.GeminiEvaluationResult geminiResult = geminiEvaluationService.evaluate(question, context, normalized, attemptNo);
                if (geminiResult != null) {
                    usedGemini = true;
                    evalSource = "GEMINI";
                    evalReason = "GEMINI_SUCCESS";

                    String feedbackText = geminiResult.feedback();
                    if (feedbackText != null && !feedbackText.isBlank()) {
                        if (isEnglish(feedbackText)) {
                            feedbackText = feedback(question, context, geminiResult.result());
                        }
                        
                        // Sanitize to be safe
                        feedbackText = AiConversationTemplateResolver.sanitize(feedbackText);
                        String suggestedRetryText = AiConversationTemplateResolver.sanitize(geminiResult.suggestedRetryText());

                        return buildOutcomeWithFeedback(
                            geminiResult.result(), geminiResult.score(), normalized,
                            feedbackText, suggestedRetryText, geminiResult.reason(),
                            question, context, usedGemini, evalSource, evalReason
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
        AiConversationEvaluationOutcome keyword = evaluateKeyword(question, context, normalized);
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
                question, context, true, evalSource, "LOCAL_SEMANTIC_PARTIAL");
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

    private AiConversationEvaluationOutcome evaluateOpenEnded(AiConversationQuestion question, AiConversationRuntimeContext context, String normalized) {
        if (normalized.length() < 2) {
            return buildOutcome(AiConversationEvaluationResult.UNCLEAR, 0.0, normalized,
                question, context, false, "LOCAL", "OPEN_ENDED_TOO_SHORT");
        }
        List<String> keywords = context.acceptedKeywordsResolved() != null ? context.acceptedKeywordsResolved() : List.of();
        keywords = keywords.stream().map(this::normalize).filter(s -> !s.isBlank()).toList();
        
        if (!keywords.isEmpty() && keywords.stream().noneMatch(normalized::contains)) {
            return buildOutcome(AiConversationEvaluationResult.PARTIALLY_CORRECT, 0.7, normalized,
                question, context, true, "LOCAL", "OPEN_ENDED_NO_KEYWORDS");
        }
        return buildOutcome(AiConversationEvaluationResult.CORRECT, 1.0, normalized,
            question, context, false, "LOCAL", "OPEN_ENDED_MATCH");
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Outcome builders
    // ═══════════════════════════════════════════════════════════════════

    private AiConversationEvaluationOutcome buildOutcome(
        AiConversationEvaluationResult result, double score, String normalized,
        AiConversationQuestion question, AiConversationRuntimeContext context, boolean needsPractice,
        String evaluationSource, String reason
    ) {
        String rawFeedback = feedback(question, context, result);
        String expectedResolved = context.expectedAnswerResolved() != null ? context.expectedAnswerResolved() : "";
        
        return new AiConversationEvaluationOutcome(
            result, score, normalized,
            rawFeedback,
            result == AiConversationEvaluationResult.INCORRECT || result == AiConversationEvaluationResult.UNCLEAR
                ? expectedResolved : "",
            reason,
            needsPractice,
            false, // usedGemini
            evaluationSource,
            false, false, false, "" // will be set by AiConversationService
        );
    }

    private AiConversationEvaluationOutcome buildOutcomeWithFeedback(
        AiConversationEvaluationResult result, double score, String normalized,
        String feedbackText, String suggestedRetryText, String reason,
        AiConversationQuestion question, AiConversationRuntimeContext context, boolean usedGemini, String evalSource, String evalReason
    ) {
        return new AiConversationEvaluationOutcome(
            result, score, normalized,
            feedbackText,
            suggestedRetryText,
            reason,
            result == AiConversationEvaluationResult.INCORRECT || result == AiConversationEvaluationResult.UNCLEAR,
            usedGemini, evalSource,
            false, false, false, "" // will be set by AiConversationService
        );
    }

    private String feedback(AiConversationQuestion question, AiConversationRuntimeContext context, AiConversationEvaluationResult result) {
        String resolvedFeedback = "";
        switch (result) {
            case CORRECT -> {
                resolvedFeedback = context.correctFeedbackResolved() != null ? context.correctFeedbackResolved().trim() : "";
                if (resolvedFeedback.isEmpty()) {
                    resolvedFeedback = (question.positiveFeedback() != null && !question.positiveFeedback().isBlank()) ? question.positiveFeedback() : "Giỏi lắm!";
                }
            }
            case PARTIALLY_CORRECT -> {
                resolvedFeedback = "Gần đúng rồi, con thử nói rõ hơn nhé.";
            }
            case INCORRECT, UNCLEAR -> {
                resolvedFeedback = context.retryFeedbackResolved() != null ? context.retryFeedbackResolved().trim() : "";
                if (resolvedFeedback.isEmpty()) {
                    String expectedResolved = context.expectedAnswerResolved() != null ? context.expectedAnswerResolved().trim() : "";
                    if (!expectedResolved.isEmpty() && !AiConversationTemplateResolver.hasUnresolvedPlaceholders(expectedResolved)) {
                        resolvedFeedback = "Không sao đâu, con nói cùng mình: " + expectedResolved + " nhé.";
                    } else {
                        resolvedFeedback = "Không sao đâu, con thử nói lại theo cách của con nhé.";
                    }
                }
            }
            case SKIPPED -> {
                resolvedFeedback = "Mình chuyển sang câu tiếp theo nhé.";
            }
        }
        
        return AiConversationTemplateResolver.resolve(resolvedFeedback, context.childName(), context.expectedAnswerResolved());
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
