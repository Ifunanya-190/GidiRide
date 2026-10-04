package ng.gidiride.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import ng.gidiride.dto.ApiResponse;
import ng.gidiride.model.User;
import ng.gidiride.model.Ride;
import ng.gidiride.model.Dispute;
import ng.gidiride.model.SosAlert;
import ng.gidiride.model.enums.*;
import ng.gidiride.repository.UserRepository;
import ng.gidiride.repository.RideRepository;
import ng.gidiride.repository.SosAlertRepository;
import ng.gidiride.repository.DisputeRepository;
import ng.gidiride.repository.WalletAccountRepository;
import ng.gidiride.service.SupportService;
import java.util.*;
import java.time.LocalDateTime;

@RestController
@RequiredArgsConstructor
public class SupportController {
    private final SupportService supportService;
    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final SosAlertRepository sosAlertRepository;
    private final DisputeRepository disputeRepository;
    private final WalletAccountRepository walletAccountRepository;

    @PostMapping("/support/disputes")
    public ResponseEntity<ApiResponse<Object>> createDispute(java.security.Principal principal, @RequestBody Map<String, Object> request) {
        User user = userRepository.findById(principal.getName()).orElseThrow();
        String rideId = (String) request.get("rideId");
        String category = (String) request.get("category");
        String details = (String) request.get("details");
        return ResponseEntity.ok(ApiResponse.success(supportService.createDispute(rideId, user.getFullName(), user.getRole().name(), category, details)));
    }

    @PostMapping("/safety/sos")
    public ResponseEntity<ApiResponse<Object>> triggerSos(java.security.Principal principal, @RequestBody Map<String, Object> request) {
        User user = userRepository.findById(principal.getName()).orElseThrow();
        String rideId = (String) request.get("rideId");
        return ResponseEntity.ok(ApiResponse.success(supportService.triggerSos(rideId, principal.getName(), user.getRole().name())));
    }

    @PostMapping("/safety/share-trip")
    public ResponseEntity<ApiResponse<Object>> shareTrip(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ApiResponse.success(Collections.emptyMap()));
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getNotifications(java.security.Principal principal) {
        User user = userRepository.findById(principal.getName()).orElseThrow();
        List<Map<String, Object>> notifs = new ArrayList<>();

        // 1. Welcome notification (always)
        notifs.add(notif("wel-" + user.getId(), "Welcome to GidiRide!",
                "Your " + user.getRole().name() + " account is active and ready.", "success",
                LocalDateTime.now().minusDays(1)));

        // 1b. Warning from admin (if any)
        if (user.getWarningMessage() != null && !user.getWarningMessage().isEmpty()) {
            notifs.add(0, notif("warn-" + user.getId(), "Policy Warning from GidiRide Admin",
                    user.getWarningMessage(), "error",
                    user.getWarningAt() != null ? user.getWarningAt() : LocalDateTime.now()));
        }

        // 1c. Ban notification
        if (user.isBanned()) {
            notifs.add(0, notif("ban-" + user.getId(), "Account Suspended",
                    "Your account has been suspended. Reason: " + (user.getBanReason() != null ? user.getBanReason() : "Policy violation"),
                    "error", LocalDateTime.now()));
        }

        // 2. Completed rides (last 5)
        List<Ride> completedRides;
        if (user.getRole() == Role.RIDER) {
            completedRides = rideRepository.findByRiderIdAndStatusIn(user.getId(), List.of(RideStatus.COMPLETED));
        } else if (user.getRole() == Role.DRIVER) {
            completedRides = rideRepository.findByDriverIdAndStatusIn(user.getId(), List.of(RideStatus.COMPLETED));
        } else {
            completedRides = List.of();
        }
        for (int i = 0; i < Math.min(completedRides.size(), 5); i++) {
            Ride ride = completedRides.get(i);
            String title = user.getRole() == Role.RIDER
                    ? "Ride Completed - " + (ride.getDropoffArea() != null ? ride.getDropoffArea() : "Destination")
                    : "Trip Completed - " + (ride.getRiderName() != null ? ride.getRiderName() : "Rider");
            String body = "Fare: NGN " + String.format("%,.0f", ride.getTotalFare())
                    + " | " + (ride.getPickupArea() != null ? ride.getPickupArea() : "") + " -> "
                    + (ride.getDropoffArea() != null ? ride.getDropoffArea() : "");
            notifs.add(notif("ride-done-" + ride.getId(), title, body, "success",
                    ride.getRequestedAt() != null ? ride.getRequestedAt() : LocalDateTime.now().minusHours(1)));
        }

        // 3. Active rides in progress
        if (user.getRole() == Role.RIDER) {
            List<Ride> activeRides = rideRepository.findByRiderIdAndStatusIn(user.getId(),
                    List.of(RideStatus.MATCHED, RideStatus.DRIVER_ARRIVING, RideStatus.IN_PROGRESS));
            if (!activeRides.isEmpty()) {
                Ride ride = activeRides.get(0);
                String driverInfo = ride.getDriverName() != null ? ride.getDriverName() + " is on the way!" : "Ride Accepted";
                notifs.add(notif("act-" + ride.getId(), driverInfo,
                        "Your driver is heading to " + (ride.getPickupArea() != null ? ride.getPickupArea() : "your pickup"),
                        "info", LocalDateTime.now()));

                if (ride.getStatus() == RideStatus.DRIVER_ARRIVING) {
                    notifs.add(notif("arr-" + ride.getId(), "Driver Arriving!",
                            (ride.getDriverName() != null ? ride.getDriverName() : "Your driver") + " is almost at " + (ride.getPickupArea() != null ? ride.getPickupArea() : "your pickup") + ". Be ready!",
                            "warning", LocalDateTime.now()));
                }
            }
        }

        if (user.getRole() == Role.DRIVER) {
            List<Ride> activeRides = rideRepository.findByDriverIdAndStatusIn(user.getId(),
                    List.of(RideStatus.MATCHED, RideStatus.DRIVER_ARRIVING, RideStatus.IN_PROGRESS));
            if (!activeRides.isEmpty()) {
                Ride ride = activeRides.get(0);
                notifs.add(notif("act-" + ride.getId(), "Active Ride in Progress",
                        "Servicing ride for " + (ride.getRiderName() != null ? ride.getRiderName() : "a rider") + " to " + (ride.getDropoffArea() != null ? ride.getDropoffArea() : "destination"),
                        "info", LocalDateTime.now()));
            }

            // Earnings notification for drivers
            notifs.add(notif("earn-" + user.getId(), "Today's Earnings Update",
                    "Check your wallet for the latest trip payouts.", "info",
                    LocalDateTime.now().minusHours(2)));
        }

        // 4. Dispute notifications - riders see their filed disputes, drivers see disputes against them
        List<Dispute> allDisputes = disputeRepository.findAllByOrderByCreatedAtDesc();
        for (Dispute d : allDisputes) {
            if (d.getOpenedBy() != null && d.getOpenedBy().equals(user.getFullName())) {
                String statusMsg = d.getStatus() == DisputeStatus.RESOLVED
                        ? "Your dispute has been resolved: " + (d.getResolution() != null ? d.getResolution() : "Resolved by admin")
                        : "Your dispute (" + d.getCategory() + ") is " + d.getStatus().name();
                String tone = d.getStatus() == DisputeStatus.RESOLVED ? "success" : "warning";
                notifs.add(notif("disp-" + d.getId(), "Dispute Update - " + d.getCategory(), statusMsg, tone,
                        d.getCreatedAt() != null ? d.getCreatedAt() : LocalDateTime.now()));
            }
        }

        // 5. Wallet balance notification
        walletAccountRepository.findByUserId(user.getId()).ifPresent(wallet -> {
            if (wallet.getBalance() > 0) {
                notifs.add(notif("wal-" + user.getId(), "Wallet Balance",
                        "You have NGN " + String.format("%,.0f", wallet.getBalance()) + " in your GidiRide wallet.",
                        "info", LocalDateTime.now().minusHours(3)));
            }
        });

        // 6. ADMIN-specific: SOS alerts + open disputes count
        if (user.getRole() == Role.ADMIN) {
            long openSos = sosAlertRepository.countByStatus(SosStatus.ACTIVE);
            if (openSos > 0) {
                notifs.add(notif("sos-alert", "SOS Alert Active!",
                        "There are " + openSos + " active SOS alerts that need immediate attention.", "error",
                        LocalDateTime.now()));
            }
            long escalatedSos = sosAlertRepository.countByStatus(SosStatus.ESCALATED);
            if (escalatedSos > 0) {
                notifs.add(notif("sos-esc", "Escalated SOS",
                        escalatedSos + " SOS alert(s) have been escalated and require urgent review.", "error",
                        LocalDateTime.now()));
            }

            long openDisputes = allDisputes.stream().filter(d -> d.getStatus() == DisputeStatus.OPEN).count();
            if (openDisputes > 0) {
                notifs.add(notif("disp-open", "Open Disputes",
                        openDisputes + " dispute(s) are waiting for admin review.", "warning",
                        LocalDateTime.now()));
            }

            // Total users stat
            long totalUsers = userRepository.count();
            notifs.add(notif("stat-users", "Platform Stats",
                    totalUsers + " registered users on GidiRide.", "info",
                    LocalDateTime.now().minusHours(6)));
        }

        // 7. Safety reminder for riders
        if (user.getRole() == Role.RIDER) {
            notifs.add(notif("safety-tip-" + user.getId(), "Safety Tip",
                    "Share your trip with trusted contacts before you ride. Go to Safety > Share Trip.",
                    "info", LocalDateTime.now().minusDays(2)));
        }

        return ResponseEntity.ok(ApiResponse.success(notifs));
    }

    private Map<String, Object> notif(String id, String title, String body, String tone, LocalDateTime createdAt) {
        Map<String, Object> n = new HashMap<>();
        n.put("id", id);
        n.put("title", title);
        n.put("body", body);
        n.put("tone", tone);
        n.put("createdAt", createdAt != null ? createdAt.toString() : LocalDateTime.now().toString());
        return n;
    }
}
