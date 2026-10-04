package ng.gidiride.repository;

import ng.gidiride.model.GroupRide;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupRideRepository extends JpaRepository<GroupRide, String> {
    java.util.List<GroupRide> findByStatusIn(java.util.List<GroupRideStatus> statuses);
}
