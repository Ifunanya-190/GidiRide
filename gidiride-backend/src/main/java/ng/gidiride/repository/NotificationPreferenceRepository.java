package ng.gidiride.repository;

import ng.gidiride.model.NotificationPreference;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, String> {
    java.util.Optional<NotificationPreference> findByUserId(String userId);
}
