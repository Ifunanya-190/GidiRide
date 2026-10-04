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
@Table(name = "sharetripevents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShareTripEvent {

    @Id
    private String id;

    private String sessionId;

    private String message;

    private String tone;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "sessionId", insertable=false, updatable=false)
    private ShareTripSession session;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
