package com.projectha.nfc;

import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/nfc")
public class NfcTagController {
    private final NfcTagService service;

    public NfcTagController(NfcTagService service) {
        this.service = service;
    }

    @GetMapping("/resolve")
    public Map<String, Object> resolveGet(
            @RequestParam(name = "payload", required = false) String payload,
            @RequestParam(name = "uid", required = false) String uid) {
        try {
            return service.resolveTag(payload, uid);
        } catch (Exception e) {
            return errorResponse();
        }
    }

    @PostMapping("/resolve")
    public Map<String, Object> resolvePost(@RequestBody Map<String, Object> body) {
        try {
            String payload = body != null && body.containsKey("payload") && body.get("payload") != null 
                ? String.valueOf(body.get("payload")) : null;
            String uid = body != null && body.containsKey("tagUid") && body.get("tagUid") != null 
                ? String.valueOf(body.get("tagUid")) : null;
            return service.resolveTag(payload, uid);
        } catch (Exception e) {
            return errorResponse();
        }
    }

    private Map<String, Object> errorResponse() {
        Map<String, Object> map = new HashMap<>();
        map.put("success", false);
        map.put("status", "ERROR");
        map.put("message", "Có lỗi xảy ra khi đọc thẻ.");
        map.put("data", null);
        return map;
    }
}
