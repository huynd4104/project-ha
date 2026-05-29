package com.projectha.child;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.projectha.common.AuthPrincipal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class ChildDevelopmentProfileControllerTest {

    @Mock
    private ChildRepository childRepository;

    @Mock
    private ChildDevelopmentProfileRepository profileRepository;

    private ChildDevelopmentProfileController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        controller = new ChildDevelopmentProfileController(childRepository, profileRepository);
    }

    @Test
    void testGetProfileSuccess() {
        UUID userId = UUID.randomUUID();
        UUID childId = UUID.randomUUID();
        AuthPrincipal principal = new AuthPrincipal(userId, "parent@test.com", "Parent Name", "PARENT", java.util.Set.of("PARENT"));

        Map<String, Object> mockProfile = new HashMap<>();
        mockProfile.put("childId", childId.toString());
        mockProfile.put("nickname", "Huy");

        when(childRepository.requireOwned(userId, childId)).thenReturn(new HashMap<>());
        when(profileRepository.getProfileByChildId(childId)).thenReturn(mockProfile);

        Map<String, Object> result = controller.getProfile(principal, childId);

        verify(childRepository, times(1)).requireOwned(userId, childId);
        verify(profileRepository, times(1)).getProfileByChildId(childId);
        assertEquals("Huy", result.get("nickname"));
    }

    @Test
    void testUpdateProfileSuccess() {
        UUID userId = UUID.randomUUID();
        UUID childId = UUID.randomUUID();
        AuthPrincipal principal = new AuthPrincipal(userId, "parent@test.com", "Parent Name", "PARENT", java.util.Set.of("PARENT"));

        Map<String, Object> payload = new HashMap<>();
        payload.put("nickname", "Huy");
        payload.put("favoriteAnimals", "mèo, chó");

        when(childRepository.requireOwned(userId, childId)).thenReturn(new HashMap<>());
        when(profileRepository.upsertProfile(childId, payload)).thenReturn(payload);

        Map<String, Object> result = controller.updateProfile(principal, childId, payload);

        verify(childRepository, times(1)).requireOwned(userId, childId);
        verify(profileRepository, times(1)).upsertProfile(childId, payload);
        assertEquals("mèo, chó", result.get("favoriteAnimals"));
    }
}
