package ng.gidiride.service;
import lombok.RequiredArgsConstructor;
import ng.gidiride.exception.GidiRideException;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.Arrays;
import java.util.List;
import java.util.Collections;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import ng.gidiride.dto.*;
import ng.gidiride.repository.*;
import ng.gidiride.model.*;
import ng.gidiride.model.enums.*;

@Service
@RequiredArgsConstructor
public class DriverService {
    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final DriverDocumentRepository driverDocumentRepository;
    private final DriverWithdrawalRepository driverWithdrawalRepository;
    private final WalletAccountRepository walletAccountRepository;

    // ── Dashboard ───────────────────────────────────────────────
    public DriverDashboardDto getDashboard(String driverId) {
        DriverDashboardDto dto = new DriverDashboardDto();

        DriverProfile profile = driverProfileRepository.findByUserId(driverId).orElse(null);
        User user = userRepository.findById(driverId).orElse(null);

        dto.setKycStatus(profile != null && profile.getKycStatus() != null ? profile.getKycStatus().name() : "NOT_SUBMITTED");
        dto.setOnlineStatus(profile != null && profile.getOnlineStatus() != null ? profile.getOnlineStatus().name() : "OFFLINE");
        dto.setRating(user != null ? user.getRating() : 5.0);

        // Completed rides for this driver
        List<Ride> completed = rideRepository.findByDriverIdAndStatusIn(driverId, List.of(RideStatus.COMPLETED));
        LocalDate today = LocalDate.now();
        int weekOfYear = today.get(WeekFields.of(Locale.getDefault()).weekOfWeekBasedYear());

        double todayEarnings = 0;
        int todayTrips = 0;
        double weeklyEarnings = 0;

        for (Ride ride : completed) {
            double netPayout = ride.getTotalFare() - ride.getServiceFee();
            LocalDate rideDate = ride.getRequestedAt() != null ? ride.getRequestedAt().toLocalDate() : null;
            if (rideDate == null) continue;

            if (rideDate.equals(today)) {
                todayEarnings += netPayout;
                todayTrips++;
            }
            int rideWeek = rideDate.get(WeekFields.of(Locale.getDefault()).weekOfWeekBasedYear());
            if (rideWeek == weekOfYear && rideDate.getYear() == today.getYear()) {
                weeklyEarnings += netPayout;
            }
        }

        dto.setTodayTrips(todayTrips);
        dto.setTodayEarnings(Math.round(todayEarnings));
        dto.setWeeklyEarnings(Math.round(weeklyEarnings));
        dto.setAcceptanceRate(95.0); // Placeholder until we track offered vs accepted

        WalletAccount wallet = walletAccountRepository.findByUserId(driverId).orElse(null);
        dto.setWalletBalance(wallet != null ? wallet.getBalance() : 0);

        return dto;
    }

    // ── Profile ─────────────────────────────────────────────────
    public DriverProfile getProfile(String driverId) {
        return driverProfileRepository.findByUserId(driverId).orElseGet(() -> {
            // Auto-create profile from user record
            User user = userRepository.findById(driverId).orElse(null);
            DriverProfile p = new DriverProfile();
            p.setUserId(driverId);
            if (user != null) {
                p.setFullName(user.getFullName());
                p.setPhone(user.getPhone());
                p.setEmail(user.getEmail());
            }
            p.setKycStatus(KycStatus.NOT_SUBMITTED);
            p.setOnlineStatus(DriverOnlineStatus.OFFLINE);
            return driverProfileRepository.save(p);
        });
    }

    public List<DriverDocument> getDocuments(String driverProfileId) {
        return driverDocumentRepository.findByDriverProfileId(driverProfileId);
    }

    // ── KYC ─────────────────────────────────────────────────────
    public DriverProfile submitKyc(String driverId, DriverProfile incoming) {
        DriverProfile profile = getProfile(driverId);

        profile.setFullName(incoming.getFullName());
        profile.setPhone(incoming.getPhone());
        profile.setEmail(incoming.getEmail());
        profile.setNin(incoming.getNin());
        profile.setLicenseNumber(incoming.getLicenseNumber());
        profile.setVehicleMake(incoming.getVehicleMake());
        profile.setVehicleModel(incoming.getVehicleModel());
        profile.setVehicleColor(incoming.getVehicleColor());
        profile.setPlateNumber(incoming.getPlateNumber());
        profile.setVehicleYear(incoming.getVehicleYear());
        profile.setHomeArea(incoming.getHomeArea());

        if (profile.getKycStatus() != KycStatus.APPROVED) {
            profile.setKycStatus(KycStatus.PENDING);
            User user = userRepository.findById(driverId).orElse(null);
            if (user != null) {
                user.setKycStatus(KycStatus.PENDING);
                userRepository.save(user);
            }
        }

        return driverProfileRepository.save(profile);
    }

    // ── Online Status ───────────────────────────────────────────
    public Map<String, String> setOnlineStatus(String driverId, String status) {
        DriverProfile profile = getProfile(driverId);
        if (profile.getKycStatus() != KycStatus.APPROVED && "ONLINE".equals(status)) {
            return Map.of("onlineStatus", "OFFLINE", "error", "KYC not approved");
        }
        DriverOnlineStatus newStatus = DriverOnlineStatus.valueOf(status);
        profile.setOnlineStatus(newStatus);
        driverProfileRepository.save(profile);
        return Map.of("onlineStatus", newStatus.name());
    }

    // ── Ride Requests ───────────────────────────────────────────
    public List<RideResponseDto> getRideRequests(String driverId) {
        DriverProfile profile = getProfile(driverId);
        User user = userRepository.findById(driverId).orElse(null);
        if (profile == null || user == null || profile.getKycStatus() != KycStatus.APPROVED || profile.getOnlineStatus() != DriverOnlineStatus.ONLINE) {
            return Collections.emptyList();
        }

        // Update presence
        user.setLastActiveAt(LocalDateTime.now());
        userRepository.save(user);

        List<Ride> matching = rideRepository.findByStatusOrderByRequestedAtDesc(RideStatus.MATCHING);
        // Only show rides with no driver assigned yet
        return matching.stream()
                .filter(r -> r.getDriverId() == null)
                .filter(r -> {
                    if (r.isFemaleDriverOnly() && user.getGender() != ng.gidiride.model.enums.Gender.FEMALE) return false;
                    if (r.isMaleDriverOnly() && user.getGender() != ng.gidiride.model.enums.Gender.MALE) return false;
                    return true;
                })
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // ── Respond to Request ──────────────────────────────────────
    public RideResponseDto respondToRequest(String driverId, String rideId, String status) {
        DriverProfile profile = getProfile(driverId);
        if (profile == null || profile.getKycStatus() != KycStatus.APPROVED) {
            throw new GidiRideException(org.springframework.http.HttpStatus.FORBIDDEN, "KYC must be approved to accept rides");
        }
        Ride ride = rideRepository.findById(rideId).orElseThrow();

        if ("ACCEPTED".equals(status)) {
            User user = userRepository.findById(driverId).orElse(null);

            ride.setDriverId(driverId);
            ride.setDriverName(profile.getFullName());
            ride.setDriverPhone(profile.getPhone());
            ride.setDriverVehicle((profile.getVehicleMake() != null ? profile.getVehicleMake() : "") + " " + (profile.getVehicleModel() != null ? profile.getVehicleModel() : ""));
            ride.setDriverPlateNumber(profile.getPlateNumber());
            ride.setDriverRating(user != null ? user.getRating() : 5.0);
            ride.setDriverEtaMin(5 + (int) (Math.random() * 10)); // 5-15 min ETA
            ride.setStatus(RideStatus.MATCHED);

            return mapToDto(rideRepository.save(ride));
        }

        // DECLINED — just return the ride unchanged (leaves it for next driver)
        return mapToDto(ride);
    }

    // ── Active Trip ─────────────────────────────────────────────
    public RideResponseDto getActiveTrip(String driverId) {
        List<Ride> active = rideRepository.findByDriverIdAndStatusIn(driverId,
                Arrays.asList(RideStatus.MATCHED, RideStatus.DRIVER_ARRIVING, RideStatus.IN_PROGRESS));

        if (active.isEmpty()) {
            return null;  // CRITICAL: must return null, not empty DTO
        }
        // Return the most recent active ride
        return mapToDto(active.get(0));
    }

    // ── Update Trip Status ──────────────────────────────────────
    public RideResponseDto updateActiveTripStatus(String driverId, String status) {
        List<Ride> active = rideRepository.findByDriverIdAndStatusIn(driverId,
                Arrays.asList(RideStatus.MATCHED, RideStatus.DRIVER_ARRIVING, RideStatus.IN_PROGRESS));

        if (active.isEmpty()) {
            return null;
        }

        Ride ride = active.get(0);
        RideStatus newStatus = RideStatus.valueOf(status);
        ride.setStatus(newStatus);
        ride = rideRepository.save(ride);

        // On completion, handle driver wallet based on payment method
        if (newStatus == RideStatus.COMPLETED) {
            WalletAccount wallet = walletAccountRepository.findByUserId(driverId).orElseGet(() -> {
                WalletAccount w = new WalletAccount();
                w.setUserId(driverId);
                w.setBalance(0);
                w.setCurrency("NGN");
                w.setUpdatedAt(LocalDateTime.now());
                return walletAccountRepository.save(w);
            });
            
            if (ride.getPaymentMethod() == PaymentMethod.CASH) {
                // Driver already collected the full cash fare. Deduct only our service fee.
                wallet.setBalance(wallet.getBalance() - ride.getServiceFee());
            } else {
                // Platform collected the digital payment. Credit driver their net payout.
                double netPayout = ride.getTotalFare() - ride.getServiceFee();
                wallet.setBalance(wallet.getBalance() + netPayout);
            }
            
            wallet.setUpdatedAt(LocalDateTime.now());
            walletAccountRepository.save(wallet);
            
            // Increment total rides for the driver and rider
            User driverUser = userRepository.findById(driverId).orElse(null);
            if (driverUser != null) {
                driverUser.setTotalRides(driverUser.getTotalRides() + 1);
                userRepository.save(driverUser);
            }
            User riderUser = userRepository.findById(ride.getRiderId()).orElse(null);
            if (riderUser != null) {
                riderUser.setTotalRides(riderUser.getTotalRides() + 1);
                userRepository.save(riderUser);
            }
        }

        return mapToDto(ride);
    }

    // ── Earnings ────────────────────────────────────────────────
    public EarningsSummaryDto getEarnings(String driverId) {
        EarningsSummaryDto dto = new EarningsSummaryDto();

        List<Ride> completed = rideRepository.findByDriverIdAndStatusIn(driverId, List.of(RideStatus.COMPLETED));
        LocalDate today = LocalDate.now();
        int weekOfYear = today.get(WeekFields.of(Locale.getDefault()).weekOfWeekBasedYear());
        int month = today.getMonthValue();

        double todayTotal = 0, weekTotal = 0, monthTotal = 0;
        List<TripDto> trips = new java.util.ArrayList<>();

        for (Ride ride : completed) {
            double net = ride.getTotalFare() - ride.getServiceFee();
            LocalDate rideDate = ride.getRequestedAt() != null ? ride.getRequestedAt().toLocalDate() : today;

            if (rideDate.equals(today)) todayTotal += net;

            int rideWeek = rideDate.get(WeekFields.of(Locale.getDefault()).weekOfWeekBasedYear());
            if (rideWeek == weekOfYear && rideDate.getYear() == today.getYear()) weekTotal += net;

            if (rideDate.getMonthValue() == month && rideDate.getYear() == today.getYear()) monthTotal += net;

            TripDto trip = new TripDto();
            trip.setId(ride.getId());
            trip.setRoute((ride.getPickupArea() != null ? ride.getPickupArea() : "Unknown") + " → " + (ride.getDropoffArea() != null ? ride.getDropoffArea() : "Unknown"));
            trip.setAmount(net);
            trip.setDate(ride.getRequestedAt());
            trip.setPayoutStatus("CREDITED");
            trips.add(trip);
        }

        dto.setToday(Math.round(todayTotal));
        dto.setWeek(Math.round(weekTotal));
        dto.setMonth(Math.round(monthTotal));
        dto.setTrips(trips);

        WalletAccount wallet = walletAccountRepository.findByUserId(driverId).orElse(null);
        dto.setWalletBalance(wallet != null ? wallet.getBalance() : 0);

        // Pending withdrawals
        List<DriverWithdrawal> pending = driverWithdrawalRepository.findByDriverIdOrderByCreatedAtDesc(driverId)
                .stream().filter(w -> w.getStatus() == WithdrawalStatus.PENDING).collect(Collectors.toList());
        dto.setWithdrawalsPending(pending.stream().mapToDouble(DriverWithdrawal::getAmount).sum());

        return dto;
    }

    // ── Withdrawals ─────────────────────────────────────────────
    public List<DriverWithdrawal> getWithdrawals(String driverId) {
        return driverWithdrawalRepository.findByDriverIdOrderByCreatedAtDesc(driverId);
    }

    public DriverWithdrawal requestWithdrawal(String driverId, WithdrawalRequestDto request) {
        WalletAccount wallet = walletAccountRepository.findByUserId(driverId).orElse(null);
        if (wallet == null || wallet.getBalance() < request.getAmount()) {
            throw new RuntimeException("Insufficient wallet balance");
        }

        // Deduct from wallet
        wallet.setBalance(wallet.getBalance() - request.getAmount());
        wallet.setUpdatedAt(LocalDateTime.now());
        walletAccountRepository.save(wallet);

        // Create withdrawal record
        DriverWithdrawal withdrawal = new DriverWithdrawal();
        withdrawal.setDriverId(driverId);
        withdrawal.setAmount(request.getAmount());
        withdrawal.setBankName(request.getBankName());
        withdrawal.setAccountNumber(request.getAccountNumber());
        withdrawal.setAccountName(request.getAccountName());
        withdrawal.setStatus(WithdrawalStatus.PENDING);
        withdrawal.setCreatedAt(LocalDateTime.now());

        return driverWithdrawalRepository.save(withdrawal);
    }

    // ── Shared DTO mapper ───────────────────────────────────────
    private RideResponseDto mapToDto(Ride ride) {
        RideResponseDto dto = new RideResponseDto();
        dto.setId(ride.getId());
        dto.setRiderId(ride.getRiderId());
        dto.setRiderName(ride.getRiderName());

        LocationDto p = new LocationDto();
        p.setId(ride.getPickupId()); p.setName(ride.getPickupName()); p.setArea(ride.getPickupArea());
        p.setLat(ride.getPickupLat()); p.setLng(ride.getPickupLng());
        dto.setPickup(p);

        LocationDto d = new LocationDto();
        d.setId(ride.getDropoffId()); d.setName(ride.getDropoffName()); d.setArea(ride.getDropoffArea());
        d.setLat(ride.getDropoffLat()); d.setLng(ride.getDropoffLng());
        dto.setDropoff(d);

        if (ride.getRideType() != null) dto.setRideType(ride.getRideType().name());
        dto.setTotalFare(ride.getTotalFare());
        if (ride.getStatus() != null) dto.setStatus(ride.getStatus().name());
        dto.setRequestedAt(ride.getRequestedAt());
        dto.setDistanceKm(ride.getDistanceKm());
        dto.setDurationMin(ride.getDurationMin());
        if (ride.getPaymentMethod() != null) dto.setPaymentMethod(ride.getPaymentMethod().name());
        dto.setBaseFare(ride.getBaseFare());
        dto.setDistanceFare(ride.getDistanceFare());
        dto.setSurge(ride.getSurge());
        dto.setServiceFee(ride.getServiceFee());

        if (ride.getDriverId() != null) {
            DriverInfoDto driver = new DriverInfoDto();
            driver.setId(ride.getDriverId());
            driver.setName(ride.getDriverName());
            driver.setPhone(ride.getDriverPhone());
            driver.setVehicle(ride.getDriverVehicle());
            driver.setPlateNumber(ride.getDriverPlateNumber());
            driver.setRating(ride.getDriverRating());
            driver.setEtaMin(ride.getDriverEtaMin());
            dto.setDriver(driver);
        }

        SafetyDto safety = new SafetyDto();
        safety.setShareTrip(ride.isShareTrip());
        safety.setSosEnabled(ride.isSosEnabled());
        safety.setFemaleDriverOnly(ride.isFemaleDriverOnly());
        dto.setSafety(safety);

        return dto;
    }
}

