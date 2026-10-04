package ng.gidiride.repository;

import ng.gidiride.model.ReferralInvite;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReferralInviteRepository extends JpaRepository<ReferralInvite, String> {
    java.util.List<ReferralInvite> findByProfileId(String profileId);
}
