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
@Table(name = "driverdocuments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DriverDocument {

    @Id
    private String id;

    private String driverProfileId;

    private String label;

    private String fileName;

    private LocalDateTime uploadedAt;

    @Enumerated(EnumType.STRING)
    private KycStatus status;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
