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
@Table(name = "ridereviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RideReview {

    @Id
    private String id;

    private String rideId;

    private String reviewerId;

    private String driverId;

    private int stars;

    private String comment;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
