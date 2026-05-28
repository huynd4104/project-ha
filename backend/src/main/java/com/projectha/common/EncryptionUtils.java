package com.projectha.common;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.function.Supplier;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EncryptionUtils {
    private static final Logger log = LoggerFactory.getLogger(EncryptionUtils.class);
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/CBC/PKCS5Padding";

    private final String injectedSecret;
    private final Supplier<String> envSecretSupplier;

    @Autowired
    public EncryptionUtils(@Value("${project-ha.ai.config.encryption-secret:}") String injectedSecret) {
        this(injectedSecret, () -> System.getenv("AI_CONFIG_ENCRYPTION_SECRET"));
    }

    EncryptionUtils(String injectedSecret, Supplier<String> envSecretSupplier) {
        this.injectedSecret = injectedSecret;
        this.envSecretSupplier = envSecretSupplier;
    }

    @PostConstruct
    public void init() {
        String effectiveSecret = getEffectiveSecret();
        boolean injectedConfigured = injectedSecret != null && !injectedSecret.isBlank();
        String envVal = envSecretSupplier.get();
        boolean envConfigured = envVal != null && !envVal.isBlank();
        boolean effectiveConfigured = !effectiveSecret.isBlank();

        log.info("[EncryptionUtils] injectedSecretConfigured={}, envSecretConfigured={}, effectiveSecretConfigured={}, effectiveSecretLength={}",
            injectedConfigured, envConfigured, effectiveConfigured, effectiveSecret.length());

        if (!effectiveConfigured) {
            log.error("[EncryptionUtils] AI_CONFIG_ENCRYPTION_SECRET is not configured.");
        }
    }

    private String getEffectiveSecret() {
        if (injectedSecret != null && !injectedSecret.isBlank()) {
            return injectedSecret.trim();
        }
        String env = envSecretSupplier.get();
        if (env != null && !env.isBlank()) {
            return env.trim();
        }
        return "";
    }

    public boolean isSecretConfigured() {
        return !getEffectiveSecret().isBlank();
    }

    public int getSecretLength() {
        return getEffectiveSecret().length();
    }

    public String encrypt(String strToEncrypt) {
        if (strToEncrypt == null || strToEncrypt.isBlank()) return null;
        String secret = getEffectiveSecret();
        if (secret.isBlank()) {
            throw new IllegalStateException("Backend chưa cấu hình AI_CONFIG_ENCRYPTION_SECRET nên không thể lưu API key.");
        }
        try {
            byte[] iv = new byte[16];
            new java.security.SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, deriveKey(secret), new IvParameterSpec(iv));
            byte[] encrypted = cipher.doFinal(strToEncrypt.getBytes(StandardCharsets.UTF_8));

            return Base64.getEncoder().encodeToString(iv) + ":" + Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            log.error("[EncryptionUtils] Encryption failed", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public String decrypt(String strToDecrypt) {
        if (strToDecrypt == null || strToDecrypt.isBlank()) return null;
        String secret = getEffectiveSecret();
        if (secret.isBlank()) {
            throw new IllegalStateException("Backend chưa cấu hình AI_CONFIG_ENCRYPTION_SECRET nên không thể đọc API key.");
        }
        try {
            String[] parts = strToDecrypt.split(":");
            if (parts.length != 2) {
                throw new IllegalArgumentException("Invalid encrypted format. Expected iv:ciphertext.");
            }
            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] ciphertext = Base64.getDecoder().decode(parts[1]);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, deriveKey(secret), new IvParameterSpec(iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("[EncryptionUtils] Decryption failed", e);
            throw new RuntimeException("Decryption failed", e);
        }
    }

    /**
     * Derive a 256-bit AES key from the secret using SHA-256.
     * This ensures the key is always the correct length regardless of input.
     */
    private SecretKeySpec deriveKey(String myKey) throws Exception {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        byte[] key = sha.digest(myKey.getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(key, ALGORITHM);
    }
}
