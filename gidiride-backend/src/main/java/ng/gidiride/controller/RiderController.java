package ng.gidiride.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import ng.gidiride.dto.*;
import ng.gidiride.service.RiderService;
import ng.gidiride.service.SupportService;
import ng.gidiride.model.RiderProfileSettings;

@RestController
@RequestMapping("/rider")
@RequiredArgsConstructor
public class RiderController {
    private final RiderService riderService;
    private final SupportService supportService;
    private final ng.gidiride.repository.UserRepository userRepository;

    @PostMapping("/rides/estimate")
    public ResponseEntity<ApiResponse<FareEstimateResponseDto>> estimateFare(java.security.Principal principal, @RequestBody FareEstimateRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success(riderService.estimateFare(request)));
    }
    @PostMapping("/rides/request")
    public ResponseEntity<ApiResponse<RideResponseDto>> requestRide(java.security.Principal principal, @RequestBody FareEstimateRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success(riderService.requestRide(request, principal.getName())));
    }
    @GetMapping("/rides/current")
    public ResponseEntity<ApiResponse<RideResponseDto>> getCurrentRide(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(riderService.getCurrentRide(principal.getName())));
    }
    @PatchMapping("/rides/{id}/status")
    public ResponseEntity<ApiResponse<RideResponseDto>> updateRideStatus(java.security.Principal principal, @PathVariable String id, @RequestBody java.util.Map<String, Object> status) {
        return ResponseEntity.ok(ApiResponse.success(riderService.advanceRide(id, String.valueOf(status.get("status")))));
    }
    @GetMapping("/rides/history")
    public ResponseEntity<ApiResponse<List<RideResponseDto>>> getRideHistory(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(riderService.getRideHistory(principal.getName())));
    }
    @PostMapping("/rides/{rideId}/review")
    public ResponseEntity<ApiResponse<Object>> reviewRide(java.security.Principal principal, @PathVariable String rideId, @RequestBody java.util.Map<String, Object> review) {
        int stars = Integer.parseInt(String.valueOf(review.get("stars")));
        String comment = (String) review.get("comment");
        return ResponseEntity.ok(ApiResponse.success(supportService.submitReview(rideId, principal.getName(), stars, comment)));
    }
    @GetMapping("/profile/settings")
    public ResponseEntity<ApiResponse<RiderProfileSettings>> getProfileSettings(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(riderService.getProfile(principal.getName())));
    }
    @PutMapping("/profile/settings")
    public ResponseEntity<ApiResponse<RiderProfileSettings>> updateProfileSettings(java.security.Principal principal, @RequestBody RiderProfileSettings settings) {
        return ResponseEntity.ok(ApiResponse.success(riderService.saveProfile(principal.getName(), settings)));
    }
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Object>> updateUserProfile(java.security.Principal principal, @RequestBody java.util.Map<String, String> body) {
        ng.gidiride.model.User user = userRepository.findById(principal.getName()).orElseThrow();
        if (body.containsKey("fullName") && body.get("fullName") != null) user.setFullName(body.get("fullName"));
        if (body.containsKey("phone") && body.get("phone") != null) user.setPhone(body.get("phone"));
        if (body.containsKey("email") && body.get("email") != null) user.setEmail(body.get("email"));
        userRepository.save(user);
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("fullName", user.getFullName());
        result.put("phone", user.getPhone());
        result.put("email", user.getEmail());
        return ResponseEntity.ok(ApiResponse.success(result));
    }
    @GetMapping("/wallet")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getWallet(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyMap()));
    }
    @PostMapping("/wallet/top-up")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> topUpWallet(java.security.Principal principal, @RequestBody java.util.Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyMap()));
    }
    @GetMapping("/wallet/transactions")
    public ResponseEntity<ApiResponse<List<Object>>> getWalletTransactions(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyList()));
    }
    @GetMapping("/payment-methods")
    public ResponseEntity<ApiResponse<List<Object>>> getPaymentMethods(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyList()));
    }
    @PostMapping("/payment-methods")
    public ResponseEntity<ApiResponse<List<Object>>> addPaymentMethod(java.security.Principal principal, @RequestBody java.util.Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyList()));
    }
    @DeleteMapping("/payment-methods/{id}")
    public ResponseEntity<ApiResponse<List<Object>>> removePaymentMethod(java.security.Principal principal, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyList()));
    }
    @PatchMapping("/payment-methods/{id}/default")
    public ResponseEntity<ApiResponse<List<Object>>> setDefaultPaymentMethod(java.security.Principal principal, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyList()));
    }
    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<java.util.List<ng.gidiride.model.RideReview>>> getReviews(java.security.Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(supportService.getMyReviews(principal.getName())));
    }
}
