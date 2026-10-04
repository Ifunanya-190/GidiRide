package ng.gidiride.repository;

import ng.gidiride.model.ShareTripEvent;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShareTripEventRepository extends JpaRepository<ShareTripEvent, String> {
    java.util.List<ShareTripEvent> findBySessionId(String sessionId);
}
