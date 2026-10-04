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
@Table(name = "driverbadgeprofiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DriverBadgeProfile {

    @Id
    private String id;

    @Column(unique=true)
    private String driverId;

    private String driverName;

    private int safeDriverCount;

    private int goodAcCount;

    private int playsMyMusicCount;

    private int cleanCarCount;

    private int fastPickupCount;

    private int politeCount;

    private double tipTotal;

    private LocalDateTime lastTipAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
