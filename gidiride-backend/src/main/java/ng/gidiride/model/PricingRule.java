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
@Table(name = "pricingrules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PricingRule {

    @Id
    private String id;

    @Column(unique=true) @Enumerated(EnumType.STRING)
    private RideType rideType;

    private String label;

    private double baseFare;

    private double perKm;

    private double serviceFee;

    private double surgeMultiplier;

    private double fuelAdjustment;

    private boolean enabled;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
