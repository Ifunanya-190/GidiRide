package ng.gidiride.repository;

import ng.gidiride.model.DriverBadgeProfile;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverBadgeProfileRepository extends JpaRepository<DriverBadgeProfile, String> {
    java.util.Optional<DriverBadgeProfile> findByDriverId(String driverId);
}
