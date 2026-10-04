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
@Table(name = "savedpaymentmethods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SavedPaymentMethod {

    @Id
    private String id;

    private String userId;

    private String type;

    private String label;

    private String last4;

    @Enumerated(EnumType.STRING)
    private PaymentProvider provider;

    private boolean isDefault;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
