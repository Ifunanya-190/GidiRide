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
@Table(name = "driverwithdrawals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DriverWithdrawal {

    @Id
    private String id;

    private String driverId;

    private double amount;

    private String bankName;

    private String accountNumber;

    private String accountName;

    @Enumerated(EnumType.STRING)
    private WithdrawalStatus status = WithdrawalStatus.PENDING;

    private LocalDateTime createdAt;

    private String rejectionReason;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
