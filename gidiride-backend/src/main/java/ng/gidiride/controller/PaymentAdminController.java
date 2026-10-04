package ng.gidiride.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import ng.gidiride.dto.ApiResponse;
import ng.gidiride.service.PaymentService;
import ng.gidiride.model.DriverWithdrawal;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class PaymentAdminController {
    private final PaymentService paymentService;

    @GetMapping("/payouts")
    public ResponseEntity<ApiResponse<List<DriverWithdrawal>>> getPayouts() { 
        return ResponseEntity.ok(ApiResponse.success(paymentService.getAllWithdrawals())); 
    }
    @PatchMapping("/payouts/{id}/approve")
    public ResponseEntity<ApiResponse<DriverWithdrawal>> approvePayout(@PathVariable String id) { 
        return ResponseEntity.ok(ApiResponse.success(paymentService.approveWithdrawal(id))); 
    }
    @PatchMapping("/payouts/{id}/reject")
    public ResponseEntity<ApiResponse<DriverWithdrawal>> rejectPayout(@PathVariable String id, @RequestBody Map<String, String> payload) { 
        return ResponseEntity.ok(ApiResponse.success(paymentService.rejectWithdrawal(id, payload.getOrDefault("reason", "Rejected")))); 
    }
    @PostMapping("/refund")
    public ResponseEntity<ApiResponse<String>> refundUser(@RequestBody Map<String, Object> payload) {
        String userId = (String) payload.get("userId");
        Number amount = (Number) payload.get("amount");
        if (userId != null && amount != null) {
            paymentService.creditWallet(userId, amount.doubleValue());
        }
        return ResponseEntity.ok(ApiResponse.success("Refunded successfully"));
    }
}
