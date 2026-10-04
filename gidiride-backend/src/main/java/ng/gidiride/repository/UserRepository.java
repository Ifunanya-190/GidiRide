package ng.gidiride.repository;

import ng.gidiride.model.User;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    java.util.Optional<User> findByEmail(String email);
    java.util.Optional<User> findByPhone(String phone);
    java.util.Optional<User> findByEmailOrPhone(String email, String phone);
    java.util.List<User> findByRole(Role role);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    long countByBannedTrue();
}
