package ng.gidiride.repository;

import ng.gidiride.model.SavedPaymentMethod;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SavedPaymentMethodRepository extends JpaRepository<SavedPaymentMethod, String> {
    java.util.List<SavedPaymentMethod> findByUserId(String userId);
}
