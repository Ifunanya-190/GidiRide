package ng.gidiride.repository;

import ng.gidiride.model.RiderProfileSettings;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RiderProfileSettingsRepository extends JpaRepository<RiderProfileSettings, String> {
    java.util.Optional<RiderProfileSettings> findByUserId(String userId);
}
