package ng.gidiride.repository;

import ng.gidiride.model.SosAlert;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SosAlertRepository extends JpaRepository<SosAlert, String> {
    java.util.List<SosAlert> findAllByOrderByCreatedAtDesc();
    long countByStatus(SosStatus status);
}
