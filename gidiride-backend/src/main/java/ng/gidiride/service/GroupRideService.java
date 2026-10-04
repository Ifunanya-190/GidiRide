package ng.gidiride.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Collections;
import ng.gidiride.repository.*;
import ng.gidiride.model.*;

@Service
@RequiredArgsConstructor
public class GroupRideService {
    private final GroupRideRepository groupRideRepository;
    private final GroupRideMemberRepository groupRideMemberRepository;
    private final ShareTripSessionRepository shareTripSessionRepository;
    private final ShareTripEventRepository shareTripEventRepository;
    private final UserRepository userRepository;

    public List<GroupRide> getGroupRides() { return Collections.emptyList(); }
    public GroupRide createGroupRide(String creatorId, GroupRide payload) { return new GroupRide(); }
    public GroupRide joinGroupRide(String userId, String groupId) { return new GroupRide(); }
    public ShareTripSession startShareTrip(String rideId, List<String> contacts, boolean liveAudio) { return new ShareTripSession(); }
    public List<ShareTripSession> getShareSessions() { return Collections.emptyList(); }
}
