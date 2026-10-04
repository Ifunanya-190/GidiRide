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
@Table(name = "referralprofiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReferralProfile {

    @Id
    private String id;

    @Column(unique=true)
    private String ownerId;

    @Enumerated(EnumType.STRING)
    private Role ownerRole;

    @Column(unique=true)
    private String code;

    private String link;

    private int invited = 0;

    private int completed = 0;

    private double rewardBalance = 0;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
