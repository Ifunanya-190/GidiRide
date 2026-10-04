package ng.gidiride.repository;

import ng.gidiride.model.ShareTripSession;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShareTripSessionRepository extends JpaRepository<ShareTripSession, String> {
    java.util.Optional<ShareTripSession> findByRideId(String rideId);
    java.util.List<ShareTripSession> findAllByOrderByCreatedAtDesc();
}
