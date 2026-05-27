package com.projectha.media;

import java.net.URI;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
public class MediaService {
    private final MediaRepository repo;
    private final String endpoint;
    private final String accessKey;
    private final String secretKey;
    private final String bucket;
    private final String publicBaseUrl;
    private final String region;

    public MediaService(
        MediaRepository repo,
        @Value("${project-ha.r2.endpoint}") String endpoint,
        @Value("${project-ha.r2.access-key-id}") String accessKey,
        @Value("${project-ha.r2.secret-access-key}") String secretKey,
        @Value("${project-ha.r2.bucket}") String bucket,
        @Value("${project-ha.r2.public-base-url}") String publicBaseUrl,
        @Value("${project-ha.r2.region}") String region
    ) {
        this.repo = repo;
        this.endpoint = endpoint;
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.bucket = bucket;
        this.publicBaseUrl = publicBaseUrl;
        this.region = region;
    }

    public Map<String, Object> presign(UUID ownerId, Map<String, Object> payload) {
        String fileName = String.valueOf(payload.getOrDefault("fileName", "upload.bin"));
        String contentType = String.valueOf(payload.getOrDefault("contentType", "application/octet-stream"));
        Long sizeBytes = payload.get("sizeBytes") instanceof Number n ? n.longValue() : null;
        String key = "uploads/" + ownerId + "/" + UUID.randomUUID() + "/" + fileName.replaceAll("[^A-Za-z0-9._-]", "_");
        Map<String, Object> media = repo.createPending(ownerId, key, bucket, fileName, contentType, sizeBytes);
        String uploadUrl = "";
        if (!endpoint.isBlank() && !accessKey.isBlank() && !secretKey.isBlank() && !bucket.isBlank()) {
            try (S3Presigner presigner = presigner()) {
                PutObjectRequest put = PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build();
                uploadUrl = presigner.presignPutObject(PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(15))
                    .putObjectRequest(put)
                    .build()).url().toString();
            }
        }
        return Map.of("mediaFile", media, "objectKey", key, "uploadUrl", uploadUrl, "headers", Map.of("Content-Type", contentType));
    }

    public Map<String, Object> complete(UUID ownerId, Map<String, Object> payload) {
        UUID id = UUID.fromString(String.valueOf(payload.get("mediaFileId")));
        Map<String, Object> media = repo.byId(id);
        String key = String.valueOf(media.get("objectKey"));
        String publicUrl = publicBaseUrl.isBlank() ? "" : publicBaseUrl.replaceAll("/$", "") + "/" + key;
        return repo.complete(id, ownerId, publicUrl, payload.get("metadata") instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of());
    }

    public Map<String, Object> byId(UUID id) {
        return repo.byId(id);
    }

    public void delete(UUID id, UUID userId) {
        try {
            Map<String, Object> media = repo.byId(id);
            String key = String.valueOf(media.get("objectKey"));
            if (key != null && !key.isBlank() && !endpoint.isBlank() && !accessKey.isBlank() && !secretKey.isBlank() && !bucket.isBlank()) {
                try (software.amazon.awssdk.services.s3.S3Client s3 = s3Client()) {
                    s3.deleteObject(software.amazon.awssdk.services.s3.model.DeleteObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .build());
                }
            }
        } catch (Exception e) {
            // Log warning or handle gracefully
            System.err.println("Lỗi khi xóa file trên R2: " + e.getMessage());
        }
        repo.delete(id, userId);
    }

    public Map<String, String> uploadDirect(String key, byte[] bytes, String contentType) {
        if (endpoint.isBlank() || accessKey.isBlank() || secretKey.isBlank() || bucket.isBlank()) {
            throw new IllegalStateException("Cấu hình R2 Storage không đầy đủ.");
        }
        try (S3Client s3 = s3Client()) {
            s3.putObject(
                PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType)
                    .build(),
                RequestBody.fromBytes(bytes)
            );
            String publicUrl = publicBaseUrl.isBlank() ? "" : publicBaseUrl.replaceAll("/$", "") + "/" + key;
            return Map.of("objectKey", key, "publicUrl", publicUrl);
        }
    }

    public void deleteDirect(String key) {
        if (key == null || key.isBlank()) return;
        if (!endpoint.isBlank() && !accessKey.isBlank() && !secretKey.isBlank() && !bucket.isBlank()) {
            try (S3Client s3 = s3Client()) {
                s3.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
            } catch (Exception e) {
                System.err.println("Lỗi khi xóa file direct trên R2: " + e.getMessage());
            }
        }
    }

    private S3Presigner presigner() {
        return S3Presigner.builder()
            .endpointOverride(URI.create(endpoint))
            .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
            .region(Region.of(region == null || region.isBlank() ? "auto" : region))
            .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
            .build();
    }

    private software.amazon.awssdk.services.s3.S3Client s3Client() {
        return software.amazon.awssdk.services.s3.S3Client.builder()
            .endpointOverride(URI.create(endpoint))
            .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
            .region(Region.of(region == null || region.isBlank() ? "auto" : region))
            .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
            .build();
    }
}
