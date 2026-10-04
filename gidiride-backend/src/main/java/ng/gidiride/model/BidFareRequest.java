package ng.gidiride.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import ng.gidiride.model.enums.*;

@Entity
@Table(name = "bidfarerequests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BidFareRequest {

    @Id
    private String id;

    private String riderId;

    private String riderName;

    private String pickupId;

    private String pickupName;

    private String pickupArea;

    private double pickupLat;

    private double pickupLng;

    private String dropoffId;

    private String dropoffName;

    private String dropoffArea;

    private double dropoffLat;

    private double dropoffLng;

    @Enumerated(EnumType.STRING)
    private RideType rideType;

    private double proposedCash;

    private String barterOffer;

    private boolean femaleDriverOnly;

    private String notes;

    @Enumerated(EnumType.STRING)
    private BidStatus status = BidStatus.OPEN;

    private LocalDateTime createdAt;

    private String acceptedBidId;

    @Transient
    private java.util.List<DriverBid> bids = new java.util.ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
