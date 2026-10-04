package ng.gidiride.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Collections;
import ng.gidiride.dto.*;
import ng.gidiride.repository.*;
import ng.gidiride.model.*;
import ng.gidiride.model.enums.*;

@Service
@RequiredArgsConstructor
public class RiderService {
    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final HotZoneRepository hotZoneRepository;
    private final RiderProfileSettingsRepository riderProfileSettingsRepository;

    public FareEstimateResponseDto estimateFare(FareEstimateRequestDto request) {
        // Haversine formula for distance
        double R = 6371.0;
        double lat1 = request.getPickup().getLat();
        double lon1 = request.getPickup().getLng();
        double lat2 = request.getDropoff().getLat();
        double lon2 = request.getDropoff().getLng();
        
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        // Base distance + minimum padding for traffic
        double distanceKm = Math.max(R * c * 1.35, 1.2); 
        int durationMin = (int) Math.max(distanceKm * 4.5, 3); // Approx 4.5 mins per km in Lagos traffic
        
        // Fetch Pricing Rule
        RideType type = RideType.valueOf(request.getRideType());
        PricingRule rule = pricingRuleRepository.findAll().stream()
            .filter(r -> r.getRideType() == type)
            .findFirst()
            .orElseGet(() -> {
                PricingRule fallback = new PricingRule();
                fallback.setBaseFare(1000);
                fallback.setPerKm(200);
                fallback.setServiceFee(150);
                fallback.setFuelAdjustment(0);
                fallback.setSurgeMultiplier(1.0);
                return fallback;
            });
            
        // Check HotZones by area name
        double hotZoneSurge = 1.0;
        List<HotZone> activeZones = hotZoneRepository.findAll();
        for (HotZone zone : activeZones) {
            if (zone.isActive() && zone.getName().equalsIgnoreCase(request.getPickup().getArea())) {
                hotZoneSurge = zone.getMultiplier();
                break;
            }
        }
        
        double finalSurge = Math.max(rule.getSurgeMultiplier(), hotZoneSurge);
        double distanceFare = distanceKm * rule.getPerKm();
        double subtotal = rule.getBaseFare() + distanceFare + rule.getFuelAdjustment();
        double totalFare = (subtotal * finalSurge) + rule.getServiceFee();
        
        // Round to nearest 50
        totalFare = Math.round(totalFare / 50.0) * 50.0;
        
        FareEstimateResponseDto res = new FareEstimateResponseDto();
        res.setId(java.util.UUID.randomUUID().toString());
        res.setPickup(request.getPickup());
        res.setDropoff(request.getDropoff());
        res.setRideType(request.getRideType());
        res.setPaymentMethod(request.getPaymentMethod());
        res.setDistanceKm(Math.round(distanceKm * 10.0) / 10.0);
        res.setDurationMin(durationMin);
        res.setBaseFare(rule.getBaseFare());
        res.setDistanceFare(Math.round(distanceFare));
        res.setSurge(finalSurge);
        res.setServiceFee(rule.getServiceFee());
        res.setTotalFare(totalFare);
        if (hotZoneSurge > 1.0) {
            res.setNote("Fares are slightly higher due to high demand in " + request.getPickup().getArea());
        }
        return res;
    }

    public RideResponseDto requestRide(FareEstimateRequestDto request, String riderId) { 
        User user = userRepository.findById(riderId).orElse(null);
        FareEstimateResponseDto estimate = estimateFare(request);
        Ride ride = new Ride();
        ride.setRiderId(riderId);
        ride.setRiderName(user != null ? user.getFullName() : "GidiRide User");
        ride.setPickupId(request.getPickup().getId());
        ride.setPickupName(request.getPickup().getName());
        ride.setPickupArea(request.getPickup().getArea());
        ride.setPickupLat(request.getPickup().getLat());
        ride.setPickupLng(request.getPickup().getLng());
        ride.setDropoffId(request.getDropoff().getId());
        ride.setDropoffName(request.getDropoff().getName());
        ride.setDropoffArea(request.getDropoff().getArea());
        ride.setDropoffLat(request.getDropoff().getLat());
        ride.setDropoffLng(request.getDropoff().getLng());
        ride.setRideType(RideType.valueOf(request.getRideType()));
        ride.setTotalFare(estimate.getTotalFare());
        ride.setDistanceKm(estimate.getDistanceKm());
        ride.setDurationMin(estimate.getDurationMin());
        if (request.getPaymentMethod() != null) {
            ride.setPaymentMethod(PaymentMethod.valueOf(request.getPaymentMethod()));
        } else {
            ride.setPaymentMethod(PaymentMethod.CASH);
        }
        ride.setBaseFare(estimate.getBaseFare());
        ride.setDistanceFare(estimate.getDistanceFare());
        ride.setSurge(estimate.getSurge());
        ride.setServiceFee(estimate.getServiceFee());
        ride.setStatus(RideStatus.MATCHING);
        ride.setRequestedAt(java.time.LocalDateTime.now());
        
        RiderProfileSettings profile = getProfile(riderId);
        ride.setShareTrip(profile.isAutoShareTrip());
        ride.setFemaleDriverOnly(profile.isFemaleDriverOnly());
        ride.setMaleDriverOnly(profile.isMaleDriverOnly());

        if (request.getFemaleDriverOnly() != null) {
            ride.setFemaleDriverOnly(request.getFemaleDriverOnly());
        }
        if (request.getMaleDriverOnly() != null) {
            ride.setMaleDriverOnly(request.getMaleDriverOnly());
        }

        ride = rideRepository.save(ride);
        return mapToDto(ride);
    }
    
    public RideResponseDto getCurrentRide(String riderId) { 
        // Update presence
        User user = userRepository.findById(riderId).orElse(null);
        if (user != null) {
            user.setLastActiveAt(java.time.LocalDateTime.now());
            userRepository.save(user);
        }

        return rideRepository.findAll().stream()
            .filter(r -> r.getRiderId().equals(riderId) && r.getStatus() != RideStatus.COMPLETED && r.getStatus() != RideStatus.CANCELLED)
            .sorted((a, b) -> b.getRequestedAt().compareTo(a.getRequestedAt()))
            .findFirst()
            .map(this::mapToDto)
            .orElse(null);
    }
    
    public RideResponseDto advanceRide(String rideId, String status) { 
        Ride ride = rideRepository.findById(rideId).orElseThrow();
        ride.setStatus(RideStatus.valueOf(status));
        return mapToDto(rideRepository.save(ride)); 
    }
    
    public List<RideResponseDto> getRideHistory(String riderId) { 
        return rideRepository.findAll().stream()
            .filter(r -> r.getRiderId().equals(riderId) && (r.getStatus() == RideStatus.COMPLETED || r.getStatus() == RideStatus.CANCELLED))
            .map(this::mapToDto)
            .collect(java.util.stream.Collectors.toList());
    }
    
    public RiderProfileSettings getProfile(String userId) { 
        return riderProfileSettingsRepository.findByUserId(userId).orElseGet(() -> {
            RiderProfileSettings s = new RiderProfileSettings();
            s.setUserId(userId);
            s.setDefaultPaymentMethod(PaymentMethod.CASH);
            return s;
        }); 
    }
    
    public RiderProfileSettings saveProfile(String userId, RiderProfileSettings settings) { 
        settings.setUserId(userId);
        return riderProfileSettingsRepository.save(settings); 
    }
    
    private RideResponseDto mapToDto(Ride ride) {
        RideResponseDto dto = new RideResponseDto();
        dto.setId(ride.getId());
        dto.setRiderId(ride.getRiderId());
        
        LocationDto p = new LocationDto();
        p.setId(ride.getPickupId()); p.setName(ride.getPickupName()); p.setArea(ride.getPickupArea()); p.setLat(ride.getPickupLat()); p.setLng(ride.getPickupLng());
        dto.setPickup(p);
        
        LocationDto d = new LocationDto();
        d.setId(ride.getDropoffId()); d.setName(ride.getDropoffName()); d.setArea(ride.getDropoffArea()); d.setLat(ride.getDropoffLat()); d.setLng(ride.getDropoffLng());
        dto.setDropoff(d);
        
        dto.setRideType(ride.getRideType().name());
        dto.setTotalFare(ride.getTotalFare());
        dto.setStatus(ride.getStatus().name());
        dto.setRequestedAt(ride.getRequestedAt());
        dto.setDistanceKm(ride.getDistanceKm());
        dto.setDurationMin(ride.getDurationMin());
        if (ride.getPaymentMethod() != null) {
            dto.setPaymentMethod(ride.getPaymentMethod().name());
        }
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
        safety.setMaleDriverOnly(ride.isMaleDriverOnly());
        dto.setSafety(safety);
        
        return dto;
    }
}
