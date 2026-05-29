package com.projectha.child;

import com.projectha.common.AuthPrincipal;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/children/{childId}/development-profile")
public class ChildDevelopmentProfileController {
    private final ChildRepository childRepository;
    private final ChildDevelopmentProfileRepository profileRepository;

    public ChildDevelopmentProfileController(
        ChildRepository childRepository,
        ChildDevelopmentProfileRepository profileRepository
    ) {
        this.childRepository = childRepository;
        this.profileRepository = profileRepository;
    }

    @GetMapping
    public Map<String, Object> getProfile(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID childId
    ) {
        // Enforce ownership
        childRepository.requireOwned(principal.id(), childId);
        return profileRepository.getProfileByChildId(childId);
    }

    @PutMapping
    public Map<String, Object> updateProfile(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID childId,
        @RequestBody Map<String, Object> payload
    ) {
        // Enforce ownership
        childRepository.requireOwned(principal.id(), childId);
        // Upsert, ignoring any childId passed in the body (using the path variable for safety)
        return profileRepository.upsertProfile(childId, payload);
    }
}
