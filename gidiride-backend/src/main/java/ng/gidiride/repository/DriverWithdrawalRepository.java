package ng.gidiride.repository;

import ng.gidiride.model.DriverWithdrawal;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverWithdrawalRepository extends JpaRepository<DriverWithdrawal, String> {
    java.util.List<DriverWithdrawal> findByDriverIdOrderByCreatedAtDesc(String driverId);
    java.util.List<DriverWithdrawal> findAllByOrderByCreatedAtDesc();
}
