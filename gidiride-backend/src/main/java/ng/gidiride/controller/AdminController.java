package ng.gidiride.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import ng.gidiride.dto.*;
import ng.gidiride.service.AdminService;
import ng.gidiride.service.PaymentService;
import ng.gidiride.service.AnalyticsService;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;
    private final PaymentService paymentService;
    private final AnalyticsService analyticsService;
    private final ng.gidiride.repository.DisputeRepository disputeRepository;
    private final ng.gidiride.repository.SosAlertRepository sosAlertRepository;
    private final ng.gidiride.repository.RideRepository rideRepository;
    private final ng.gidiride.repository.UserRepository userRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getStats()));
    }
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getUsers(@RequestParam(required = false) String role) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUsers(role)));
    }
    @PatchMapping("/users/{id}/ban")
    public ResponseEntity<ApiResponse<UserDto>> banUser(@PathVariable String id, @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(ApiResponse.success(adminService.banUser(id, payload.getOrDefault("reason", "Violated terms of service"))));
    }
    @PatchMapping("/users/{id}/unban")
    public ResponseEntity<ApiResponse<UserDto>> unbanUser(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.unbanUser(id)));
    }
    @PostMapping("/users/{id}/warn")
    public ResponseEntity<ApiResponse<UserDto>> warnUser(@PathVariable String id, @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(ApiResponse.success(adminService.warnUser(id, payload.getOrDefault("reason", "Warning issued"))));
    }
    @GetMapping("/drivers/{id}/profile")
    public ResponseEntity<ApiResponse<ng.gidiride.model.DriverProfile>> getDriverProfile(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getDriverProfile(id)));
    }
    @PatchMapping("/drivers/{id}/kyc/approve")
    public ResponseEntity<ApiResponse<UserDto>> approveDriverKyc(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.approveDriverKyc(id)));
    }
    @PatchMapping("/drivers/{id}/kyc/reject")
    public ResponseEntity<ApiResponse<UserDto>> rejectDriverKyc(@PathVariable String id, @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(ApiResponse.success(adminService.rejectDriverKyc(id, payload.getOrDefault("reason", "Invalid documents"))));
    }
    @GetMapping("/pricing")
    public ResponseEntity<ApiResponse<PricingSettingsDto>> getPricing() {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getPricing()));
    }
    @PutMapping("/pricing")
    public ResponseEntity<ApiResponse<PricingSettingsDto>> updatePricing(@RequestBody PricingSettingsDto settings) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.savePricing(settings)));
    }

    @GetMapping("/disputes")
    public ResponseEntity<ApiResponse<List<ng.gidiride.model.Dispute>>> getDisputes() {
        return ResponseEntity.ok(ApiResponse.success(disputeRepository.findAllByOrderByCreatedAtDesc()));
    }

    @PatchMapping("/disputes/{id}/resolve")
    public ResponseEntity<ApiResponse<ng.gidiride.model.Dispute>> resolveDispute(@PathVariable String id, @RequestBody Map<String, String> payload) {
        ng.gidiride.model.Dispute dispute = disputeRepository.findById(id).orElseThrow();
        dispute.setStatus(ng.gidiride.model.enums.DisputeStatus.RESOLVED);
        dispute.setResolution(payload.getOrDefault("note", "Resolved by admin"));
        dispute.setResolvedAt(java.time.LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.success(disputeRepository.save(dispute)));
    }

    @DeleteMapping("/disputes/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDispute(@PathVariable String id) {
        disputeRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/sos")
    public ResponseEntity<ApiResponse<List<ng.gidiride.model.SosAlert>>> getSos() {
        return ResponseEntity.ok(ApiResponse.success(sosAlertRepository.findAllByOrderByCreatedAtDesc()));
    }

    @PatchMapping("/sos/{id}/resolve")
    public ResponseEntity<ApiResponse<ng.gidiride.model.SosAlert>> resolveSos(@PathVariable String id, @RequestBody Map<String, String> payload) {
        ng.gidiride.model.SosAlert sos = sosAlertRepository.findById(id).orElseThrow();
        sos.setStatus(ng.gidiride.model.enums.SosStatus.RESOLVED);
        sos.setNotes(payload.getOrDefault("note", "Resolved by admin"));
        sos.setResolvedAt(java.time.LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.success(sosAlertRepository.save(sos)));
    }

    @DeleteMapping("/sos/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSos(@PathVariable String id) {
        sosAlertRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AdminAnalyticsDto>> getAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getAdminAnalytics()));
    }

    @GetMapping("/rides/{rideId}/context")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRideContext(@PathVariable String rideId) {
        Map<String, Object> ctx = new java.util.HashMap<>();
        rideRepository.findById(rideId).ifPresent(ride -> {
            ctx.put("rideId", ride.getId());
            ctx.put("riderId", ride.getRiderId());
            ctx.put("driverId", ride.getDriverId());
            ctx.put("riderName", ride.getRiderName());
            ctx.put("driverName", ride.getDriverName());
            ctx.put("route", (ride.getPickupArea() != null ? ride.getPickupArea() : "") + " -> " + (ride.getDropoffArea() != null ? ride.getDropoffArea() : ""));
            ctx.put("status", ride.getStatus() != null ? ride.getStatus().name() : null);
            ctx.put("totalFare", ride.getTotalFare());
            ctx.put("paymentMethod", ride.getPaymentMethod() != null ? ride.getPaymentMethod().name() : null);
            ctx.put("rideType", ride.getRideType() != null ? ride.getRideType().name() : null);
            ctx.put("requestedAt", ride.getRequestedAt());
            
            if (ride.getRiderId() != null) {
                userRepository.findById(ride.getRiderId()).ifPresent(u -> {
                    UserDto dto = adminService.mapUserToDto(u);
                    ctx.put("rider", dto);
                });
            }
            if (ride.getDriverId() != null) {
                userRepository.findById(ride.getDriverId()).ifPresent(u -> {
                    UserDto dto = adminService.mapUserToDto(u);
                    ctx.put("driver", dto);
                });
            }
        });
        return ResponseEntity.ok(ApiResponse.success(ctx));
    }
}
