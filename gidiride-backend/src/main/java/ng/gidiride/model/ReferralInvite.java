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
@Table(name = "referralinvites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReferralInvite {

    @Id
    private String id;

    private String profileId;

    private String phoneOrEmail;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String status;

    private double reward = 0;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
