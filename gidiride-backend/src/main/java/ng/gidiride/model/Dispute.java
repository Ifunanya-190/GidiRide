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
@Table(name = "disputes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Dispute {

    @Id
    private String id;

    private String rideId;

    private String openedBy;

    @Enumerated(EnumType.STRING)
    private Role openedByRole;

    @Enumerated(EnumType.STRING)
    private DisputeCategory category;

    private String details;

    @Enumerated(EnumType.STRING)
    private DisputeStatus status = DisputeStatus.OPEN;

    @Enumerated(EnumType.STRING)
    private DisputePriority priority;

    private LocalDateTime createdAt;

    private String resolution;

    private LocalDateTime resolvedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
