package com.projectha.common;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> validation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .orElse("Payload không hợp lệ.");
        return body(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler({BadCredentialsException.class})
    ResponseEntity<Map<String, Object>> credentials(RuntimeException ex, HttpServletRequest request) {
        return body(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng.", request);
    }

    @ExceptionHandler({AccessDeniedException.class, ForbiddenException.class})
    ResponseEntity<Map<String, Object>> forbidden(RuntimeException ex, HttpServletRequest request) {
        return body(HttpStatus.FORBIDDEN, ex.getMessage() == null ? "Bạn không có quyền." : ex.getMessage(), request);
    }

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<Map<String, Object>> notFound(NotFoundException ex, HttpServletRequest request) {
        return body(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(BadRequestException.class)
    ResponseEntity<Map<String, Object>> badRequest(BadRequestException ex, HttpServletRequest request) {
        return body(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, Object>> responseStatus(ResponseStatusException ex, HttpServletRequest request) {
        return body(HttpStatus.valueOf(ex.getStatusCode().value()), ex.getReason(), request);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> fallback(Exception ex, HttpServletRequest request) {
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Server error: " + ex.getMessage(), request);
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(Map.of(
            "timestamp", Instant.now().toString(),
            "status", status.value(),
            "error", status.getReasonPhrase(),
            "message", message == null ? status.getReasonPhrase() : message,
            "path", request.getRequestURI()
        ));
    }
}
