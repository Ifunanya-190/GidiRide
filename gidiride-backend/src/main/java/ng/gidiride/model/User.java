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
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    private String fullName;

    @Column(unique=true)
    private String email;

    @Column(unique=true)
    private String phone;

    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private boolean banned = false;

    private String banReason;

    private LocalDateTime createdAt;

    private LocalDateTime lastActiveAt;

    @Enumerated(EnumType.STRING)
    private KycStatus kycStatus;

    private int totalRides = 0;

    private double rating = 5.0;

    private String vehicle;

    private String warningMessage;

    private LocalDateTime warningAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
