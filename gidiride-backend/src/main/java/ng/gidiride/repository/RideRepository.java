package ng.gidiride.repository;

import ng.gidiride.model.Ride;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RideRepository extends JpaRepository<Ride, String> {
    java.util.List<Ride> findByRiderIdOrderByRequestedAtDesc(String riderId);
    java.util.List<Ride> findByRiderIdAndStatusNotIn(String riderId, java.util.List<RideStatus> statuses);
    java.util.List<Ride> findByRiderIdAndStatusIn(String riderId, java.util.List<RideStatus> statuses);
    java.util.List<Ride> findByDriverIdAndStatusIn(String driverId, java.util.List<RideStatus> statuses);
    java.util.List<Ride> findByStatusOrderByRequestedAtDesc(RideStatus status);
    java.util.List<Ride> findByStatusInOrderByRequestedAtDesc(java.util.List<RideStatus> statuses);
}
