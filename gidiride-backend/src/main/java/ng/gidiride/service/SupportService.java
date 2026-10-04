package ng.gidiride.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import ng.gidiride.repository.*;
import ng.gidiride.model.*;
import ng.gidiride.model.enums.*;

@Service
@RequiredArgsConstructor
public class SupportService {
    private final RideReviewRepository rideReviewRepository;
    private final DisputeRepository disputeRepository;
    private final SosAlertRepository sosAlertRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;

    public RideReview submitReview(String rideId, String reviewerId, int stars, String comment) {
        Ride ride = rideRepository.findById(rideId).orElseThrow();
        User reviewer = userRepository.findById(reviewerId).orElseThrow();
        RideReview review = new RideReview();
        review.setId("REV-" + UUID.randomUUID().toString().substring(0, 8));
        review.setRideId(rideId);
        review.setReviewerId(reviewerId);
        review.setDriverId(reviewer.getRole() == Role.RIDER ? ride.getDriverId() : ride.getRiderId());
        review.setStars(stars);
        review.setComment(comment);
        review.setCreatedAt(LocalDateTime.now());
        return rideReviewRepository.save(review);
    }
    
    public java.util.List<RideReview> getMyReviews(String userId) {
        return rideReviewRepository.findByReviewerId(userId);
    }

    public Dispute createDispute(String rideId, String openedBy, String openedByRole, String category, String details) {
        Dispute dispute = new Dispute();
        dispute.setId("GR-DSP-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        dispute.setRideId(rideId);
        dispute.setOpenedBy(openedBy);
        dispute.setOpenedByRole(Role.valueOf(openedByRole));
        dispute.setCategory(DisputeCategory.valueOf(category));
        dispute.setDetails(details);
        dispute.setStatus(DisputeStatus.OPEN);
        dispute.setCreatedAt(LocalDateTime.now());
        
        if (dispute.getCategory() == DisputeCategory.SAFETY) {
            dispute.setPriority(DisputePriority.CRITICAL);
        } else if (dispute.getCategory() == DisputeCategory.PAYMENT) {
            dispute.setPriority(DisputePriority.HIGH);
        } else {
            dispute.setPriority(DisputePriority.MEDIUM);
        }
        
        return disputeRepository.save(dispute);
    }
    
    public SosAlert triggerSos(String rideId, String userId, String triggeredBy) {
        Ride ride = rideRepository.findById(rideId).orElseThrow();
        SosAlert alert = new SosAlert();
        alert.setId("GR-SOS-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        alert.setRideId(rideId);
        alert.setRiderId(ride.getRiderId());
        alert.setRiderName(ride.getRiderName());
        alert.setDriverName(ride.getDriverName());
        alert.setRoute(ride.getPickupArea() + " to " + ride.getDropoffArea());
        alert.setStatus(SosStatus.ACTIVE);
        alert.setTriggeredBy(triggeredBy);
        alert.setCreatedAt(LocalDateTime.now());
        alert.setNotes(triggeredBy.equals("DRIVER") ? "Driver pressed SOS during trip." : "Rider pressed SOS in live tracking.");
        return sosAlertRepository.save(alert);
    }
    
    public List<Dispute> getAdminDisputes() { return disputeRepository.findAllByOrderByCreatedAtDesc(); }
    public List<SosAlert> getAdminSosAlerts() { return sosAlertRepository.findAllByOrderByCreatedAtDesc(); }
    
    public Dispute resolveDispute(String id, String resolution) { 
        Dispute dispute = disputeRepository.findById(id).orElseThrow();
        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setResolution(resolution);
        dispute.setResolvedAt(LocalDateTime.now());
        return disputeRepository.save(dispute);
    }
    
    public void deleteDispute(String id) { disputeRepository.deleteById(id); }
    
    public SosAlert resolveSos(String id, String notes) {
        SosAlert alert = sosAlertRepository.findById(id).orElseThrow();
        alert.setStatus(SosStatus.RESOLVED);
        alert.setNotes(notes);
        alert.setResolvedAt(LocalDateTime.now());
        return sosAlertRepository.save(alert);
    }
    
    public void deleteSos(String id) { sosAlertRepository.deleteById(id); }
}
