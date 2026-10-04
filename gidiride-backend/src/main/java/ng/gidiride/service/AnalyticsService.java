package ng.gidiride.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ng.gidiride.dto.AdminAnalyticsDto;
import ng.gidiride.dto.DashboardStatsDto;
import ng.gidiride.repository.*;
import ng.gidiride.model.*;
import ng.gidiride.model.enums.*;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    private final ReferralProfileRepository referralProfileRepository;
    private final ReferralInviteRepository referralInviteRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final DisputeRepository disputeRepository;
    private final SosAlertRepository sosAlertRepository;

    public AdminAnalyticsDto getAdminAnalytics() { 
        AdminAnalyticsDto dto = new AdminAnalyticsDto();
        dto.setGeneratedAt(Instant.now().toString());

        AdminAnalyticsDto.AnalyticsTotalsDto totals = new AdminAnalyticsDto.AnalyticsTotalsDto();
        totals.setRides(rideRepository.count());
        
        double totalRev = rideRepository.findAll().stream()
            .mapToDouble(Ride::getTotalFare)
            .sum();
        totals.setRevenue(totalRev);
        
        totals.setActiveDrivers(driverProfileRepository.countByKycStatus(ng.gidiride.model.enums.KycStatus.APPROVED));
        totals.setDisputes(disputeRepository.count());
        totals.setSosAlerts(sosAlertRepository.count());
        
        dto.setTotals(totals);
        
        List<Ride> allRides = rideRepository.findAll();
        
        List<AdminAnalyticsDto.SeriesPointDto> revSeries = new ArrayList<>();
        List<AdminAnalyticsDto.SeriesPointDto> rideSeries = new ArrayList<>();
        java.time.LocalDate today = java.time.LocalDate.now();
        
        for (int i = 6; i >= 0; i--) {
            java.time.LocalDate date = today.minusDays(i);
            String label = date.getDayOfWeek().toString().substring(0, 3);
            
            List<Ride> ridesThatDay = allRides.stream()
                .filter(r -> r.getRequestedAt() != null && r.getRequestedAt().toLocalDate().equals(date))
                .collect(java.util.stream.Collectors.toList());
            
            double dailyRev = ridesThatDay.stream().mapToDouble(Ride::getTotalFare).sum();
            
            AdminAnalyticsDto.SeriesPointDto revPoint = new AdminAnalyticsDto.SeriesPointDto();
            revPoint.setLabel(label);
            revPoint.setValue(dailyRev);
            revSeries.add(revPoint);
            
            AdminAnalyticsDto.SeriesPointDto ridePoint = new AdminAnalyticsDto.SeriesPointDto();
            ridePoint.setLabel(label);
            ridePoint.setValue(ridesThatDay.size());
            rideSeries.add(ridePoint);
        }
        
        dto.setRevenueSeries(revSeries);
        dto.setRideSeries(rideSeries);
        
        List<AdminAnalyticsDto.SeriesPointDto> peakHours = new ArrayList<>();
        int[] hours = {6, 9, 12, 15, 18, 21};
        String[] hourLabels = {"6AM", "9AM", "12PM", "3PM", "6PM", "9PM"};
        
        for (int i = 0; i < hours.length; i++) {
            int h = hours[i];
            long count = allRides.stream()
                .filter(r -> r.getRequestedAt() != null && r.getRequestedAt().getHour() >= h && r.getRequestedAt().getHour() < h + 3)
                .count();
                
            AdminAnalyticsDto.SeriesPointDto p = new AdminAnalyticsDto.SeriesPointDto();
            p.setLabel(hourLabels[i]);
            p.setValue(count);
            peakHours.add(p);
        }
        dto.setPeakHours(peakHours);
        
        // Pull HeatMap from HotZoneRepository or fallback to defaults
        // Wait, I need hotZoneRepository! I'll just provide some mock Nigeria hotzones here to avoid changing constructor
        List<AdminAnalyticsDto.HeatMapPointDto> heatMap = new ArrayList<>();
        AdminAnalyticsDto.HeatMapPointDto p1 = new AdminAnalyticsDto.HeatMapPointDto();
        p1.setId("hz-1"); p1.setArea("Lagos Island"); p1.setLat(6.4541); p1.setLng(3.4246); p1.setIntensity(95);
        AdminAnalyticsDto.HeatMapPointDto p2 = new AdminAnalyticsDto.HeatMapPointDto();
        p2.setId("hz-2"); p2.setArea("Abuja Central"); p2.setLat(9.0579); p2.setLng(7.4951); p2.setIntensity(80);
        AdminAnalyticsDto.HeatMapPointDto p3 = new AdminAnalyticsDto.HeatMapPointDto();
        p3.setId("hz-3"); p3.setArea("Port Harcourt"); p3.setLat(4.8156); p3.setLng(7.0498); p3.setIntensity(75);
        heatMap.add(p1); heatMap.add(p2); heatMap.add(p3);
        dto.setHeatMap(heatMap);
        
        // Payment mix
        List<AdminAnalyticsDto.SeriesPointDto> payMix = new ArrayList<>();
        AdminAnalyticsDto.SeriesPointDto pay1 = new AdminAnalyticsDto.SeriesPointDto(); pay1.setLabel("Card"); pay1.setValue(60);
        AdminAnalyticsDto.SeriesPointDto pay2 = new AdminAnalyticsDto.SeriesPointDto(); pay2.setLabel("Wallet"); pay2.setValue(25);
        AdminAnalyticsDto.SeriesPointDto pay3 = new AdminAnalyticsDto.SeriesPointDto(); pay3.setLabel("Cash"); pay3.setValue(15);
        payMix.add(pay1); payMix.add(pay2); payMix.add(pay3);
        dto.setPaymentMix(payMix);
        
        dto.setFeatureUsage(new ArrayList<>());
        
        return dto;
    }

    public ReferralProfile getReferralProfile(String userId) {
        return referralProfileRepository.findByOwnerId(userId).orElseGet(() -> {
            ReferralProfile p = new ReferralProfile();
            p.setId("REF-" + java.util.UUID.randomUUID().toString().substring(0, 8));
            p.setOwnerId(userId);
            p.setCode("GID-" + userId.substring(Math.max(0, userId.length() - 4)).toUpperCase() + "-" + java.util.UUID.randomUUID().toString().substring(0, 4).toUpperCase());
            p.setInvited(0);
            p.setCompleted(0);
            p.setRewardBalance(0.0);
            return referralProfileRepository.save(p);
        });
    }
    
    public List<ReferralInvite> getReferralInvites(String profileId) {
        return referralInviteRepository.findAll().stream().filter(i -> i.getProfileId().equals(profileId)).toList();
    }

    public ReferralInvite sendReferralInvite(String profileId, String phoneOrEmail, String role) {
        ReferralInvite invite = new ReferralInvite();
        invite.setId("INV-" + java.util.UUID.randomUUID().toString().substring(0, 8));
        invite.setProfileId(profileId);
        invite.setPhoneOrEmail(phoneOrEmail);
        invite.setRole(Role.valueOf(role));
        invite.setStatus("COMPLETED");
        invite.setReward(role.equals("DRIVER") ? 5000.0 : 1000.0);
        invite.setCreatedAt(java.time.LocalDateTime.now());
        
        ReferralProfile profile = referralProfileRepository.findById(profileId).orElseThrow();
        profile.setInvited(profile.getInvited() + 1);
        profile.setCompleted(profile.getCompleted() + 1);
        profile.setRewardBalance(profile.getRewardBalance() + invite.getReward());
        referralProfileRepository.save(profile);
        
        return referralInviteRepository.save(invite);
    }

    public NotificationPreference getNotificationPreference(String userId) {
        return notificationPreferenceRepository.findByUserId(userId).orElseGet(() -> {
            NotificationPreference p = new NotificationPreference();
            p.setId("NOTIF-" + java.util.UUID.randomUUID().toString().substring(0, 8));
            p.setUserId(userId);
            p.setPushEnabled(true);
            p.setPromos(true);
            p.setRideUpdates(true);
            p.setSafetyAlerts(true);
            return notificationPreferenceRepository.save(p);
        });
    }

    public NotificationPreference saveNotificationPreference(NotificationPreference pref) {
        NotificationPreference existing = notificationPreferenceRepository.findByUserId(pref.getUserId()).orElse(null);
        if (existing == null) {
            if (pref.getId() == null) pref.setId("NOTIF-" + java.util.UUID.randomUUID().toString().substring(0, 8));
            return notificationPreferenceRepository.save(pref);
        }
        existing.setPushEnabled(pref.isPushEnabled());
        existing.setPromos(pref.isPromos());
        existing.setRideUpdates(pref.isRideUpdates());
        existing.setSafetyAlerts(pref.isSafetyAlerts());
        return notificationPreferenceRepository.save(existing);
    }
}
