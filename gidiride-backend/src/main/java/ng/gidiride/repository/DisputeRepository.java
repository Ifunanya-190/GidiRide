package ng.gidiride.repository;

import ng.gidiride.model.Dispute;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, String> {
    java.util.List<Dispute> findAllByOrderByCreatedAtDesc();
}
