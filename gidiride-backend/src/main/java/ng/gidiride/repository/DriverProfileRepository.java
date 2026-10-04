package ng.gidiride.repository;

import ng.gidiride.model.DriverProfile;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverProfileRepository extends JpaRepository<DriverProfile, String> {
    java.util.Optional<DriverProfile> findByUserId(String userId);
    long countByKycStatus(KycStatus status);
}
