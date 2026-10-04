package ng.gidiride.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import ng.gidiride.dto.*;
import ng.gidiride.model.DriverProfile;
import ng.gidiride.model.DriverDocument;
import ng.gidiride.model.DriverWithdrawal;
import ng.gidiride.service.DriverService;

@RestController
@RequestMapping("/driver")
@RequiredArgsConstructor
public class DriverController {
    private final DriverService driverService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DriverDashboardDto>> getDashboard(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(driverService.getDashboard(principal.getName())));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<DriverProfile>> getProfile(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(driverService.getProfile(principal.getName())));
    }

    @GetMapping("/profile/documents")
    public ResponseEntity<ApiResponse<List<DriverDocument>>> getDocuments(java.security.Principal principal) {
        DriverProfile profile = driverService.getProfile(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(driverService.getDocuments(profile.getId())));
    }

    @PostMapping("/kyc")
    public ResponseEntity<ApiResponse<DriverProfile>> submitKyc(java.security.Principal principal, @RequestBody DriverProfile kyc) {
        return ResponseEntity.ok(ApiResponse.success(driverService.submitKyc(principal.getName(), kyc)));
    }

    @PatchMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, String>>> setStatus(java.security.Principal principal, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("onlineStatus", "OFFLINE");
        return ResponseEntity.ok(ApiResponse.success(driverService.setOnlineStatus(principal.getName(), status)));
    }

    @GetMapping("/ride-requests")
    public ResponseEntity<ApiResponse<List<RideResponseDto>>> getRideRequests(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(driverService.getRideRequests(principal.getName())));
    }

    @PatchMapping("/ride-requests/{id}")
    public ResponseEntity<ApiResponse<RideResponseDto>> respondToRequest(java.security.Principal principal, @PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "ACCEPTED");
        return ResponseEntity.ok(ApiResponse.success(driverService.respondToRequest(principal.getName(), id, status)));
    }

    @GetMapping("/trips/active")
    public ResponseEntity<ApiResponse<RideResponseDto>> getActiveTrip(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(driverService.getActiveTrip(principal.getName())));
    }

    @PatchMapping("/trips/active/status")
    public ResponseEntity<ApiResponse<RideResponseDto>> updateActiveTripStatus(java.security.Principal principal, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "IN_PROGRESS");
        return ResponseEntity.ok(ApiResponse.success(driverService.updateActiveTripStatus(principal.getName(), status)));
    }

    @GetMapping("/earnings")
    public ResponseEntity<ApiResponse<EarningsSummaryDto>> getEarnings(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(driverService.getEarnings(principal.getName())));
    }

    @GetMapping("/withdrawals")
    public ResponseEntity<ApiResponse<List<DriverWithdrawal>>> getWithdrawals(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(driverService.getWithdrawals(principal.getName())));
    }

    @PostMapping("/withdrawals")
    public ResponseEntity<ApiResponse<DriverWithdrawal>> requestWithdrawal(java.security.Principal principal, @RequestBody WithdrawalRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success(driverService.requestWithdrawal(principal.getName(), request)));
    }

    @GetMapping("/badges")
    public ResponseEntity<ApiResponse<List<Object>>> getBadges(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyList()));
    }
}
