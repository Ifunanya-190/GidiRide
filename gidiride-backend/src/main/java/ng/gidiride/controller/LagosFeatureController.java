package ng.gidiride.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import ng.gidiride.dto.ApiResponse;
import ng.gidiride.model.*;
import ng.gidiride.service.LagosFeatureService;

@RestController
@RequiredArgsConstructor
public class LagosFeatureController {
    private final LagosFeatureService lagosFeatureService;

    @PostMapping("/rider/bid-fares")
    public ResponseEntity<ApiResponse<BidFareRequest>> createBidFare(@RequestBody BidFareRequest request, java.security.Principal principal) { 
        return ResponseEntity.ok(ApiResponse.success(lagosFeatureService.createBidFare(principal.getName(), request))); 
    }
    
    @GetMapping("/rider/bid-fares")
    public ResponseEntity<ApiResponse<List<BidFareRequest>>> getMyBidFares(java.security.Principal principal) { 
        return ResponseEntity.ok(ApiResponse.success(lagosFeatureService.getMyBidFares(principal.getName()))); 
    }
    
    @GetMapping("/driver/bid-fares")
    public ResponseEntity<ApiResponse<List<BidFareRequest>>> getDriverBidFares() { 
        return ResponseEntity.ok(ApiResponse.success(lagosFeatureService.getOpenBidFares())); 
    }
    
    @PostMapping("/driver/bid-fares/{bidRequestId}/bids")
    public ResponseEntity<ApiResponse<DriverBid>> submitDriverBid(@PathVariable String bidRequestId, @RequestBody DriverBid request, java.security.Principal principal) { 
        return ResponseEntity.ok(ApiResponse.success(lagosFeatureService.submitDriverBid(principal.getName(), bidRequestId, request))); 
    }
    
    @PatchMapping("/rider/bid-fares/bids/{bidId}/accept")
    public ResponseEntity<ApiResponse<DriverBid>> acceptDriverBid(@PathVariable String bidId) { 
        return ResponseEntity.ok(ApiResponse.success(lagosFeatureService.acceptDriverBid(bidId))); 
    }
    
    @PostMapping("/rides/fuel-split")
    public ResponseEntity<ApiResponse<Object>> splitFuel(@RequestBody java.util.Map<String, Object> request) { 
        // Dummy implementation for now, will implement correctly if needed
        return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyMap())); 
    }
    
    @PostMapping("/rider/tips")
    public ResponseEntity<ApiResponse<DriverBadgeProfile>> sendTip(@RequestBody java.util.Map<String, Object> request) { 
        return ResponseEntity.ok(ApiResponse.success(lagosFeatureService.sendTip(request))); 
    }
    
    @GetMapping("/rider/group-rides")
    public ResponseEntity<ApiResponse<List<Object>>> getGroupRides() { 
        return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyList())); 
    }
    
    @PostMapping("/rider/group-rides")
    public ResponseEntity<ApiResponse<Object>> createGroupRide(@RequestBody java.util.Map<String, Object> request) { 
        return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyMap())); 
    }
    
    @PostMapping("/rider/group-rides/{id}/join")
    public ResponseEntity<ApiResponse<Object>> joinGroupRide(@PathVariable String id) { 
        return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyMap())); 
    }
}
