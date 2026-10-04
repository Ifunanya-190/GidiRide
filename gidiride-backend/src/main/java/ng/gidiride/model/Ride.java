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
@Table(name = "rides")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Ride {

    @Id
    private String id;

    private String riderId;

    private String riderName;

    private String pickupId;

    private String pickupName;

    private String pickupArea;

    private double pickupLat;

    private double pickupLng;

    private String dropoffId;

    private String dropoffName;

    private String dropoffArea;

    private double dropoffLat;

    private double dropoffLng;

    @Enumerated(EnumType.STRING)
    private RideType rideType;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    private double distanceKm;

    private int durationMin;

    private double baseFare;

    private double distanceFare;

    private double surge;

    private double serviceFee;

    private double totalFare;

    private String note;

    @Enumerated(EnumType.STRING)
    private RideStatus status;

    private LocalDateTime requestedAt;

    private String driverId;

    private String driverName;

    private String driverPhone;

    private double driverRating;

    private String driverVehicle;

    private String driverPlateNumber;

    private int driverEtaMin;

    private boolean shareTrip;

    private boolean sosEnabled;

    private boolean femaleDriverOnly;

    private boolean maleDriverOnly;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
