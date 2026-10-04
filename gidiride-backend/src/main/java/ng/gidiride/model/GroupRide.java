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
@Table(name = "grouprides")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroupRide {

    @Id
    private String id;

    private String creatorId;

    private String routeName;

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

    private LocalDateTime departureTime;

    private int seatsTotal;

    private int seatsTaken = 0;

    private double pricePerSeat;

    @Enumerated(EnumType.STRING)
    private RideType rideType;

    @Enumerated(EnumType.STRING)
    private GroupRideStatus status = GroupRideStatus.SCHEDULED;

    private String notes;

    @OneToMany(mappedBy = "groupRide")
    private java.util.List<GroupRideMember> members;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
