package ng.gidiride.repository;

import ng.gidiride.model.ReferralProfile;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReferralProfileRepository extends JpaRepository<ReferralProfile, String> {
    java.util.Optional<ReferralProfile> findByOwnerId(String ownerId);
    java.util.Optional<ReferralProfile> findByCode(String code);
}
