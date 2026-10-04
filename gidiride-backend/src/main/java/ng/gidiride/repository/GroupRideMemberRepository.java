package ng.gidiride.repository;

import ng.gidiride.model.GroupRideMember;
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupRideMemberRepository extends JpaRepository<GroupRideMember, String> {
    java.util.List<GroupRideMember> findByGroupRideId(String groupRideId);
    java.util.List<GroupRideMember> findByUserId(String userId);
}
