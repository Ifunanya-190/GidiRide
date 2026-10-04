package ng.gidiride.repository;

import ng.gidiride.model.WalletAccount;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WalletAccountRepository extends JpaRepository<WalletAccount, String> {
    java.util.Optional<WalletAccount> findByUserId(String userId);
}
