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
@Table(name = "notificationpreferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreference {

    @Id
    private String id;

    @Column(unique=true)
    private String userId;

    private boolean pushEnabled = false;

    private boolean rideUpdates = true;

    private boolean promos = false;

    private boolean safetyAlerts = true;

    private boolean earnings = false;

    private String endpoint;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
