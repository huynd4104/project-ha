package com.projectha.child;

import com.projectha.common.AuthPrincipal;
import com.projectha.common.BadRequestException;
import com.projectha.media.MediaService;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/children")
public class ChildController {
    private final ChildRepository children;
    private final MediaService mediaService;

    public ChildController(ChildRepository children, MediaService mediaService) {
        this.children = children;
        this.mediaService = mediaService;
    }

    @GetMapping
    public List<Map<String, Object>> list(@AuthenticationPrincipal AuthPrincipal principal) {
        return children.list(principal.id());
    }

    @PostMapping
    public Map<String, Object> create(@AuthenticationPrincipal AuthPrincipal principal, @RequestBody Map<String, Object> payload) {
        return children.create(principal.id(), payload);
    }

    @PutMapping("/{childId}")
    public Map<String, Object> update(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable UUID childId, @RequestBody Map<String, Object> payload) {
        return children.update(principal.id(), childId, payload);
    }

    @PutMapping("/{childId}/current-path")
    public Map<String, Object> currentPath(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID childId,
        @RequestBody Map<String, Object> payload
    ) {
        return children.saveCurrentPath(
            principal.id(),
            childId,
            UUID.fromString(String.valueOf(payload.get("programId"))),
            UUID.fromString(String.valueOf(payload.get("pathId")))
        );
    }

    @PostMapping(value = "/{childId}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> uploadAvatar(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable UUID childId,
        @RequestParam("file") MultipartFile file
    ) {
        // 1. Verify ownership
        Map<String, Object> child = children.requireOwned(principal.id(), childId);

        // 2. Validate file
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp"))) {
            throw new BadRequestException("Định dạng file không hợp lệ. Chỉ chấp nhận JPEG, PNG, hoặc WEBP.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("Kích thước file vượt quá giới hạn 5MB.");
        }

        try {
            // 3. Generate key and upload to R2
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : ".jpg";
            String key = "children/" + childId + "/avatar/" + UUID.randomUUID() + extension;

            Map<String, String> uploadResult = mediaService.uploadDirect(key, file.getBytes(), contentType);
            String newAvatarUrl = uploadResult.get("publicUrl");
            String newAvatarObjectKey = uploadResult.get("objectKey");

            // 4. Get old avatar object key to delete later
            String oldObjectKey = (String) child.get("avatarObjectKey");

            // 5. Update database
            children.updateAvatar(principal.id(), childId, newAvatarUrl, newAvatarObjectKey);

            // 6. Delete old avatar from R2 if it is a child avatar (safety check)
            if (oldObjectKey != null && !oldObjectKey.isBlank() && oldObjectKey.startsWith("children/")) {
                mediaService.deleteDirect(oldObjectKey);
            }

            return Map.of(
                "childId", childId.toString(),
                "avatarUrl", newAvatarUrl,
                "avatarObjectKey", newAvatarObjectKey,
                "message", "Cập nhật ảnh hồ sơ thành công"
            );
        } catch (IOException e) {
            throw new BadRequestException("Không thể đọc file upload: " + e.getMessage());
        }
    }
}
