package ng.gidiride.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import ng.gidiride.model.enums.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "sharetripsessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShareTripSession {

    @Id
    private String id;

    private String rideId;

    @JsonIgnore
    private String contacts;

    @JsonProperty("contacts")
    public java.util.List<String> getContactsList() {
        if (contacts == null || contacts.isEmpty()) return new java.util.ArrayList<>();
        return java.util.Arrays.asList(contacts.split(","));
    }

    @JsonProperty("contacts")
    public void setContactsList(java.util.List<String> list) {
        if (list == null) this.contacts = "";
        else this.contacts = String.join(",", list);
    }

    private boolean liveAudioEnabled;

    private boolean keywordDetectionEnabled;

    private String safeWords;

    @Enumerated(EnumType.STRING)
    private ShareTripStatus status = ShareTripStatus.ACTIVE;

    private LocalDateTime createdAt;

    private LocalDateTime lastAlertAt;

    @OneToMany(mappedBy = "session")
    private java.util.List<ShareTripEvent> events;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
