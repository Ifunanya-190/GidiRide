package ng.gidiride.repository;

import ng.gidiride.model.HotZone;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HotZoneRepository extends JpaRepository<HotZone, String> {
    java.util.List<HotZone> findByActiveTrue();
}
