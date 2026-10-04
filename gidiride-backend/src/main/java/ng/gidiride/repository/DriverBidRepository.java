package ng.gidiride.repository;

import ng.gidiride.model.DriverBid;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverBidRepository extends JpaRepository<DriverBid, String> {
    java.util.List<DriverBid> findByBidRequestId(String bidRequestId);
    java.util.List<DriverBid> findByDriverId(String driverId);
}
