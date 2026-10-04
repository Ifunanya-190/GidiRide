package ng.gidiride.repository;

import ng.gidiride.model.RideReview;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RideReviewRepository extends JpaRepository<RideReview, String> {
    java.util.Optional<RideReview> findByRideId(String rideId);
    java.util.List<RideReview> findByReviewerId(String reviewerId);
}
