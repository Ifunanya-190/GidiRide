package ng.gidiride.repository;

import ng.gidiride.model.DriverDocument;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverDocumentRepository extends JpaRepository<DriverDocument, String> {
    java.util.List<DriverDocument> findByDriverProfileId(String driverProfileId);
}
