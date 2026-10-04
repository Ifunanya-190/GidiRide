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
@Table(name = "sosalerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SosAlert {

    @Id
    private String id;

    private String rideId;

    private String riderId;

    private String riderName;

    private String driverName;

    private String route;

    @Enumerated(EnumType.STRING)
    private SosStatus status = SosStatus.ACTIVE;

    private String emergencyContacts;

    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;

    private String notes;

    private String triggeredBy;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
