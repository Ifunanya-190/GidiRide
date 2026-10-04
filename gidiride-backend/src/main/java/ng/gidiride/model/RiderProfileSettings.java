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
@Table(name = "riderprofilesettingss")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RiderProfileSettings {

    @Id
    private String id;

    @Column(unique=true)
    private String userId;

    private String emergencyContact1;

    private String emergencyContact2;

    private String emergencyContact3;

    @Enumerated(EnumType.STRING)
    private PaymentMethod defaultPaymentMethod;

    private boolean femaleDriverOnly;

    private boolean maleDriverOnly;

    private boolean autoShareTrip;

    private boolean liveAudioSafety;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
