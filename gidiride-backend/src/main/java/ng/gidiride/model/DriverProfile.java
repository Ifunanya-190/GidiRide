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
@Table(name = "driverprofiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DriverProfile {

    @Id
    private String id;

    @Column(unique=true)
    private String userId;

    private String fullName;

    private String phone;

    private String email;

    private String nin;

    private String licenseNumber;

    private String vehicleMake;

    private String vehicleModel;

    private String vehicleColor;

    private String plateNumber;

    private String vehicleYear;

    private String homeArea;

    @Enumerated(EnumType.STRING)
    private KycStatus kycStatus;

    @Enumerated(EnumType.STRING)
    private DriverOnlineStatus onlineStatus = DriverOnlineStatus.OFFLINE;

    private String rejectionReason;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
