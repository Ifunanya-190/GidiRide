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
@Table(name = "driverbids")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DriverBid {

    @Id
    private String id;

    private String bidRequestId;

    private String driverId;

    private String driverName;

    private double driverRating;

    private String vehicle;

    private double cashAmount;

    private boolean acceptsBarter;

    private String message;

    private int etaMin;

    @Enumerated(EnumType.STRING)
    private DriverBidStatus status = DriverBidStatus.PENDING;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
