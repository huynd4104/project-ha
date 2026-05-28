package com.projectha.common;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class EncryptionUtilsTest {

    private static final String VALID_SECRET = "12345678901234567890123456789012";

    @Test
    public void testEncryptionDecryption() {
        EncryptionUtils utils = new EncryptionUtils(VALID_SECRET, () -> "");

        String original = "AIzaSySecretApiKey12345";
        String encrypted = utils.encrypt(original);
        assertNotNull(encrypted);
        assertTrue(encrypted.contains(":"));

        String decrypted = utils.decrypt(encrypted);
        assertEquals(original, decrypted);
    }

    @Test
    public void testEncryptionFailsWithoutSecret() {
        EncryptionUtils utils = new EncryptionUtils("", () -> "");
        assertThrows(IllegalStateException.class, () -> utils.encrypt("test"));
    }

    @Test
    public void testEnvFallbackWhenInjectedEmpty() {
        EncryptionUtils utils = new EncryptionUtils("", () -> VALID_SECRET);

        String original = "env-fallback-key-12345";
        String encrypted = utils.encrypt(original);
        assertNotNull(encrypted);

        String decrypted = utils.decrypt(encrypted);
        assertEquals(original, decrypted);
    }

    @Test
    public void testOpenSslBase64StyleSecret() {
        String opensslSecret = "As++WlWi6bjmBO32crZt+I+1Zr3gcwcYujGOykmm5as=";
        EncryptionUtils utils = new EncryptionUtils(opensslSecret, () -> "");

        String original = "test-open-ssl-style-key";
        String encrypted = utils.encrypt(original);
        assertNotNull(encrypted);

        String decrypted = utils.decrypt(encrypted);
        assertEquals(original, decrypted);
    }

    @Test
    public void testInjectedSecretTakesPrecedenceOverEnv() {
        String injected = "injected-takes-precedence-12345";
        String env = "env-should-not-be-used-12345";
        EncryptionUtils utils = new EncryptionUtils(injected, () -> env);

        assertTrue(utils.isSecretConfigured());
        assertEquals(injected.length(), utils.getSecretLength());
    }

    @Test
    public void testDecryptFailsWithTamperedCiphertext() {
        EncryptionUtils utils = new EncryptionUtils(VALID_SECRET, () -> "");
        String encrypted = utils.encrypt("hello world");
        assertNotNull(encrypted);

        // Tamper with the ciphertext
        String tampered = encrypted + "X";
        assertThrows(Exception.class, () -> utils.decrypt(tampered));
    }
}
