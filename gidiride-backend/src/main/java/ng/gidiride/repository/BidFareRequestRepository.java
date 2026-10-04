package ng.gidiride.repository;

import ng.gidiride.model.BidFareRequest;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BidFareRequestRepository extends JpaRepository<BidFareRequest, String> {
    java.util.List<BidFareRequest> findByRiderId(String riderId);
    java.util.List<BidFareRequest> findByStatusIn(java.util.List<BidStatus> statuses);
}
