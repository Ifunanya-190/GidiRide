package ng.gidiride.repository;

import ng.gidiride.model.PricingRule;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PricingRuleRepository extends JpaRepository<PricingRule, String> {
    java.util.Optional<PricingRule> findByRideType(RideType rideType);
}
