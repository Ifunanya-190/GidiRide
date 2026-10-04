package ng.gidiride.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Collections;
import ng.gidiride.repository.*;
import ng.gidiride.model.*;
import ng.gidiride.model.enums.*;

@Service
@RequiredArgsConstructor
public class LagosFeatureService {
    private final BidFareRequestRepository bidFareRequestRepository;
    private final DriverBidRepository driverBidRepository;
    private final DriverBadgeProfileRepository driverBadgeProfileRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;

    public BidFareRequest createBidFare(String riderId, BidFareRequest request) { 
        request.setRiderId(riderId);
        request.setCreatedAt(java.time.LocalDateTime.now());
        request.setStatus(BidStatus.OPEN);
        return bidFareRequestRepository.save(request); 
    }
    
    public List<BidFareRequest> getMyBidFares(String riderId) { 
        List<BidFareRequest> requests = bidFareRequestRepository.findAll().stream()
            .filter(r -> riderId.equals(r.getRiderId()))
            .collect(java.util.stream.Collectors.toList());
            
        // Populate transient bids
        for(BidFareRequest req : requests) {
            req.setBids(driverBidRepository.findAll().stream()
                .filter(b -> b.getBidRequestId().equals(req.getId()))
                .collect(java.util.stream.Collectors.toList()));
        }
        return requests;
    }
    
    public List<BidFareRequest> getOpenBidFares() { 
        List<BidFareRequest> requests = bidFareRequestRepository.findAll().stream()
            .filter(r -> r.getStatus() == BidStatus.OPEN || r.getStatus() == BidStatus.BIDDED)
            .collect(java.util.stream.Collectors.toList());
            
        // Populate transient bids
        for(BidFareRequest req : requests) {
            req.setBids(driverBidRepository.findAll().stream()
                .filter(b -> b.getBidRequestId().equals(req.getId()))
                .collect(java.util.stream.Collectors.toList()));
        }
        return requests;
    }
    
    public DriverBid submitDriverBid(String driverId, String bidRequestId, DriverBid request) { 
        request.setDriverId(driverId);
        request.setBidRequestId(bidRequestId);
        request.setCreatedAt(java.time.LocalDateTime.now());
        request.setStatus(DriverBidStatus.PENDING);
        
        DriverBid saved = driverBidRepository.save(request);
        
        // Update request status
        BidFareRequest req = bidFareRequestRepository.findById(bidRequestId).orElse(null);
        if (req != null && req.getStatus() == BidStatus.OPEN) {
            req.setStatus(BidStatus.BIDDED);
            bidFareRequestRepository.save(req);
        }
        
        return saved;
    }
    
    public DriverBid acceptDriverBid(String bidId) { 
        DriverBid bid = driverBidRepository.findById(bidId).orElseThrow();
        bid.setStatus(DriverBidStatus.ACCEPTED);
        driverBidRepository.save(bid);
        
        BidFareRequest req = bidFareRequestRepository.findById(bid.getBidRequestId()).orElseThrow();
        req.setStatus(BidStatus.ACCEPTED);
        req.setAcceptedBidId(bidId);
        bidFareRequestRepository.save(req);
        
        return bid;
    }
    public Object calculateFuelSplit(String rideId, double oldFuelPrice, double newFuelPrice) { return new Object(); }
    public DriverBadgeProfile sendTip(Object payload) { return new DriverBadgeProfile(); }
    public List<DriverBadgeProfile> getDriverBadges(String driverId) { return Collections.emptyList(); }
}
