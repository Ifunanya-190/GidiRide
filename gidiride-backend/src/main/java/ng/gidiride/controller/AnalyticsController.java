package ng.gidiride.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ng.gidiride.dto.ApiResponse;
import ng.gidiride.service.AnalyticsService;
import ng.gidiride.model.*;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    @GetMapping("/referrals/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReferrals(java.security.Principal principal) {
        ReferralProfile profile = analyticsService.getReferralProfile(principal.getName());
        List<ReferralInvite> invites = analyticsService.getReferralInvites(profile.getId());
        
        Map<String, Object> response = new HashMap<>();
        response.put("profile", profile);
        response.put("invites", invites);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PostMapping("/referrals/invite")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendInvite(java.security.Principal principal, @RequestBody Map<String, Object> request) {
        String phoneOrEmail = (String) request.get("phoneOrEmail");
        String role = (String) request.get("role");
        
        ReferralProfile profile = analyticsService.getReferralProfile(principal.getName());
        ReferralInvite invite = analyticsService.sendReferralInvite(profile.getId(), phoneOrEmail, role);
        
        Map<String, Object> response = new HashMap<>();
        response.put("profile", profile);
        response.put("invite", invite);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/notifications/preferences")
    public ResponseEntity<ApiResponse<NotificationPreference>> getPreferences(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getNotificationPreference(principal.getName())));
    }
    
    @PutMapping("/notifications/preferences")
    public ResponseEntity<ApiResponse<NotificationPreference>> updatePreferences(java.security.Principal principal, @RequestBody NotificationPreference pref) {
        pref.setUserId(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(analyticsService.saveNotificationPreference(pref)));
    }
}
