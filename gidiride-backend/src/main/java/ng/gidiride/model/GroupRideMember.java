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
@Table(name = "groupridemembers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroupRideMember {

    @Id
    private String id;

    private String groupRideId;

    private String userId;

    private String name;

    private LocalDateTime joinedAt;

    @ManyToOne
    @JoinColumn(name = "groupRideId", insertable=false, updatable=false)
    private GroupRide groupRide;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
