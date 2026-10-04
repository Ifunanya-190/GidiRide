package ng.gidiride.repository;

import ng.gidiride.model.WalletTransaction;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, String> {
    java.util.List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(String userId);
}
