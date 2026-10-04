const fs = require('fs');
const path = require('path');

const baseDir = "c:/Users/ADMIN/Downloads/gidiride-frontend-checkpoint13/gidiride-backend/src/main/java/ng/gidiride";
const enumsDir = path.join(baseDir, "model", "enums");
const entitiesDir = path.join(baseDir, "model");
const reposDir = path.join(baseDir, "repository");

fs.mkdirSync(enumsDir, { recursive: true });
fs.mkdirSync(entitiesDir, { recursive: true });
fs.mkdirSync(reposDir, { recursive: true });

const enums = {
    "Role": "RIDER, DRIVER, ADMIN",
    "Gender": "FEMALE, MALE, OTHER",
    "KycStatus": "NOT_SUBMITTED, PENDING, APPROVED, REJECTED",
    "RideType": "BIKE, ECONOMY, PREMIUM",
    "PaymentMethod": "CASH, CARD, WALLET, UPI",
    "RideStatus": "DRAFT, REQUESTED, MATCHING, MATCHED, DRIVER_ARRIVING, IN_PROGRESS, COMPLETED, CANCELLED",
    "DriverOnlineStatus": "ONLINE, OFFLINE",
    "RideRequestStatus": "WAITING, ACCEPTED, DECLINED, EXPIRED",
    "PaymentProvider": "PAYSTACK, CASH, WALLET, CARD_MOCK",
    "PaymentStatus": "PENDING, SUCCESS, FAILED, CANCELLED",
    "WithdrawalStatus": "PENDING, PAID, REJECTED",
    "TransactionType": "TOP_UP, RIDE_PAYMENT, REFUND, DRIVER_EARNING, WITHDRAWAL",
    "DisputeStatus": "OPEN, IN_REVIEW, RESOLVED, REJECTED",
    "DisputeCategory": "FARE, SAFETY, DRIVER, RIDER, PAYMENT, OTHER",
    "DisputePriority": "LOW, MEDIUM, HIGH, CRITICAL",
    "SosStatus": "ACTIVE, ESCALATED, RESOLVED",
    "BidStatus": "OPEN, BIDDED, ACCEPTED, CANCELLED",
    "DriverBidStatus": "PENDING, ACCEPTED, DECLINED",
    "SkillBadge": "SAFE_DRIVER, GOOD_AC, PLAYS_MY_MUSIC, CLEAN_CAR, FAST_PICKUP, POLITE",
    "GroupRideStatus": "SCHEDULED, BOARDING, FULL, COMPLETED, CANCELLED",
    "ShareTripStatus": "ACTIVE, ALERTED, ENDED"
};

for (const [enumName, enumValues] of Object.entries(enums)) {
    const content = `package ng.gidiride.model.enums;

public enum ${enumName} {
    ${enumValues}
}
`;
    fs.writeFileSync(path.join(enumsDir, `${enumName}.java`), content);
}

const entities = [
    {
        "name": "User",
        "fields": "String id, String fullName, @Column(unique=true) String email, @Column(unique=true) String phone, String password, @Enumerated(EnumType.STRING) Role role, @Enumerated(EnumType.STRING) Gender gender, boolean banned = false, String banReason, LocalDateTime createdAt, LocalDateTime lastActiveAt, @Enumerated(EnumType.STRING) KycStatus kycStatus, int totalRides = 0, double rating = 5.0, String vehicle"
    },
    {
        "name": "Ride",
        "fields": "String id, String riderId, String riderName, String pickupId, String pickupName, String pickupArea, double pickupLat, double pickupLng, String dropoffId, String dropoffName, String dropoffArea, double dropoffLat, double dropoffLng, @Enumerated(EnumType.STRING) RideType rideType, @Enumerated(EnumType.STRING) PaymentMethod paymentMethod, double distanceKm, int durationMin, double baseFare, double distanceFare, double surge, double serviceFee, double totalFare, String note, @Enumerated(EnumType.STRING) RideStatus status, LocalDateTime requestedAt, String driverId, String driverName, String driverPhone, double driverRating, String driverVehicle, String driverPlateNumber, int driverEtaMin, boolean shareTrip, boolean sosEnabled, boolean femaleDriverOnly"
    },
    {
        "name": "RiderProfileSettings",
        "fields": "String id, @Column(unique=true) String userId, String emergencyContact1, String emergencyContact2, String emergencyContact3, @Enumerated(EnumType.STRING) PaymentMethod defaultPaymentMethod, boolean femaleDriverOnly, boolean autoShareTrip, boolean liveAudioSafety"
    },
    {
        "name": "DriverProfile",
        "fields": "String id, @Column(unique=true) String userId, String fullName, String phone, String email, String nin, String licenseNumber, String vehicleMake, String vehicleModel, String vehicleColor, String plateNumber, String vehicleYear, String homeArea, @Enumerated(EnumType.STRING) KycStatus kycStatus, @Enumerated(EnumType.STRING) DriverOnlineStatus onlineStatus = DriverOnlineStatus.OFFLINE, String rejectionReason"
    },
    {
        "name": "DriverDocument",
        "fields": "String id, String driverProfileId, String label, String fileName, LocalDateTime uploadedAt, @Enumerated(EnumType.STRING) KycStatus status"
    },
    {
        "name": "WalletAccount",
        "fields": "String id, @Column(unique=true) String userId, double balance = 0, String currency = \"NGN\", String paystackCustomerCode, LocalDateTime updatedAt"
    },
    {
        "name": "WalletTransaction",
        "fields": "String id, String userId, @Enumerated(EnumType.STRING) TransactionType type, double amount, @Enumerated(EnumType.STRING) PaymentStatus status, @Enumerated(EnumType.STRING) PaymentProvider provider, String reference, String description, LocalDateTime createdAt"
    },
    {
        "name": "SavedPaymentMethod",
        "fields": "String id, String userId, String type, String label, String last4, @Enumerated(EnumType.STRING) PaymentProvider provider, boolean isDefault"
    },
    {
        "name": "DriverWithdrawal",
        "fields": "String id, String driverId, double amount, String bankName, String accountNumber, String accountName, @Enumerated(EnumType.STRING) WithdrawalStatus status = WithdrawalStatus.PENDING, LocalDateTime createdAt, String rejectionReason"
    },
    {
        "name": "PricingRule",
        "fields": "String id, @Column(unique=true) @Enumerated(EnumType.STRING) RideType rideType, String label, double baseFare, double perKm, double serviceFee, double surgeMultiplier, double fuelAdjustment, boolean enabled"
    },
    {
        "name": "HotZone",
        "fields": "String id, String name, double multiplier, boolean active"
    },
    {
        "name": "RideReview",
        "fields": "String id, String rideId, String reviewerId, String driverId, int stars, String comment, LocalDateTime createdAt"
    },
    {
        "name": "Dispute",
        "fields": "String id, String rideId, String openedBy, @Enumerated(EnumType.STRING) Role openedByRole, @Enumerated(EnumType.STRING) DisputeCategory category, String details, @Enumerated(EnumType.STRING) DisputeStatus status = DisputeStatus.OPEN, @Enumerated(EnumType.STRING) DisputePriority priority, LocalDateTime createdAt, String resolution, LocalDateTime resolvedAt"
    },
    {
        "name": "SosAlert",
        "fields": "String id, String rideId, String riderId, String riderName, String driverName, String route, @Enumerated(EnumType.STRING) SosStatus status = SosStatus.ACTIVE, String emergencyContacts, LocalDateTime createdAt, LocalDateTime resolvedAt, String notes, String triggeredBy"
    },
    {
        "name": "BidFareRequest",
        "fields": "String id, String riderId, String riderName, String pickupId, String pickupName, String pickupArea, double pickupLat, double pickupLng, String dropoffId, String dropoffName, String dropoffArea, double dropoffLat, double dropoffLng, @Enumerated(EnumType.STRING) RideType rideType, double proposedCash, String barterOffer, boolean femaleDriverOnly, String notes, @Enumerated(EnumType.STRING) BidStatus status = BidStatus.OPEN, LocalDateTime createdAt, String acceptedBidId"
    },
    {
        "name": "DriverBid",
        "fields": "String id, String bidRequestId, String driverId, String driverName, double driverRating, String vehicle, double cashAmount, boolean acceptsBarter, String message, int etaMin, @Enumerated(EnumType.STRING) DriverBidStatus status = DriverBidStatus.PENDING, LocalDateTime createdAt"
    },
    {
        "name": "DriverBadgeProfile",
        "fields": "String id, @Column(unique=true) String driverId, String driverName, int safeDriverCount, int goodAcCount, int playsMyMusicCount, int cleanCarCount, int fastPickupCount, int politeCount, double tipTotal, LocalDateTime lastTipAt"
    },
    {
        "name": "GroupRide",
        "fields": "String id, String creatorId, String routeName, String pickupId, String pickupName, String pickupArea, double pickupLat, double pickupLng, String dropoffId, String dropoffName, String dropoffArea, double dropoffLat, double dropoffLng, LocalDateTime departureTime, int seatsTotal, int seatsTaken = 0, double pricePerSeat, @Enumerated(EnumType.STRING) RideType rideType, @Enumerated(EnumType.STRING) GroupRideStatus status = GroupRideStatus.SCHEDULED, String notes, @OneToMany(mappedBy = \"groupRide\") java.util.List<GroupRideMember> members"
    },
    {
        "name": "GroupRideMember",
        "fields": "String id, String groupRideId, String userId, String name, LocalDateTime joinedAt, @ManyToOne @JoinColumn(name = \"groupRideId\", insertable=false, updatable=false) GroupRide groupRide"
    },
    {
        "name": "ShareTripSession",
        "fields": "String id, String rideId, String contacts, boolean liveAudioEnabled, boolean keywordDetectionEnabled, String safeWords, @Enumerated(EnumType.STRING) ShareTripStatus status = ShareTripStatus.ACTIVE, LocalDateTime createdAt, LocalDateTime lastAlertAt, @OneToMany(mappedBy = \"session\") java.util.List<ShareTripEvent> events"
    },
    {
        "name": "ShareTripEvent",
        "fields": "String id, String sessionId, String message, String tone, LocalDateTime createdAt, @ManyToOne @JoinColumn(name = \"sessionId\", insertable=false, updatable=false) ShareTripSession session"
    },
    {
        "name": "ReferralProfile",
        "fields": "String id, @Column(unique=true) String ownerId, @Enumerated(EnumType.STRING) Role ownerRole, @Column(unique=true) String code, String link, int invited = 0, int completed = 0, double rewardBalance = 0, LocalDateTime createdAt"
    },
    {
        "name": "ReferralInvite",
        "fields": "String id, String profileId, String phoneOrEmail, @Enumerated(EnumType.STRING) Role role, String status, double reward = 0, LocalDateTime createdAt"
    },
    {
        "name": "NotificationPreference",
        "fields": "String id, @Column(unique=true) String userId, boolean pushEnabled = false, boolean rideUpdates = true, boolean promos = false, boolean safetyAlerts = true, boolean earnings = false, String endpoint, LocalDateTime updatedAt"
    }
];

for (const entity of entities) {
    const name = entity.name;
    const fieldsStr = entity.fields;
    
    const fieldsArr = fieldsStr.split(",").map(f => f.trim());
    
    const fieldLines = [];
    for (const f of fieldsArr) {
        const parts = f.split(" ");
        
        const annotations = [];
        let i = 0;
        while (i < parts.length) {
            if (parts[i].startsWith("@")) {
                annotations.push(parts[i]);
            } else {
                break;
            }
            i++;
        }
        
        let remaining = parts.slice(i).join(" ");
        
        if (remaining.startsWith("String id") || remaining.startsWith("String id ")) {
            annotations.push("@Id");
        }
        
        const annStr = annotations.join(" ");
        if (annStr) {
            fieldLines.push(`    ${annStr}\n    private ${remaining};`);
        } else {
            fieldLines.push(`    private ${remaining};`);
        }
    }

    const fieldsJoined = fieldLines.join("\n\n");

    const content = `package ng.gidiride.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import ng.gidiride.model.enums.*;

@Entity
@Table(name = "${name.toLowerCase()}s")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ${name} {

${fieldsJoined}

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        // Timestamp initialization logic if applicable
    }
}
`;
    fs.writeFileSync(path.join(entitiesDir, `${name}.java`), content);
}

const repos = {
    "UserRepository": "java.util.Optional<User> findByEmail(String email); java.util.Optional<User> findByPhone(String phone); java.util.Optional<User> findByEmailOrPhone(String email, String phone); java.util.List<User> findByRole(Role role); boolean existsByEmail(String email); boolean existsByPhone(String phone);",
    "RideRepository": "java.util.List<Ride> findByRiderIdOrderByRequestedAtDesc(String riderId); java.util.List<Ride> findByRiderIdAndStatusNotIn(String riderId, java.util.List<RideStatus> statuses); java.util.List<Ride> findByDriverIdAndStatusIn(String driverId, java.util.List<RideStatus> statuses); java.util.List<Ride> findByStatusOrderByRequestedAtDesc(RideStatus status); java.util.List<Ride> findByStatusInOrderByRequestedAtDesc(java.util.List<RideStatus> statuses);",
    "RiderProfileSettingsRepository": "java.util.Optional<RiderProfileSettings> findByUserId(String userId);",
    "DriverProfileRepository": "java.util.Optional<DriverProfile> findByUserId(String userId);",
    "DriverDocumentRepository": "java.util.List<DriverDocument> findByDriverProfileId(String driverProfileId);",
    "WalletAccountRepository": "java.util.Optional<WalletAccount> findByUserId(String userId);",
    "WalletTransactionRepository": "java.util.List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(String userId);",
    "SavedPaymentMethodRepository": "java.util.List<SavedPaymentMethod> findByUserId(String userId);",
    "DriverWithdrawalRepository": "java.util.List<DriverWithdrawal> findByDriverIdOrderByCreatedAtDesc(String driverId); java.util.List<DriverWithdrawal> findAllByOrderByCreatedAtDesc();",
    "PricingRuleRepository": "java.util.Optional<PricingRule> findByRideType(RideType rideType);",
    "HotZoneRepository": "java.util.List<HotZone> findByActiveTrue();",
    "RideReviewRepository": "java.util.Optional<RideReview> findByRideId(String rideId); java.util.List<RideReview> findByReviewerId(String reviewerId);",
    "DisputeRepository": "java.util.List<Dispute> findAllByOrderByCreatedAtDesc();",
    "SosAlertRepository": "java.util.List<SosAlert> findAllByOrderByCreatedAtDesc();",
    "BidFareRequestRepository": "java.util.List<BidFareRequest> findByRiderId(String riderId); java.util.List<BidFareRequest> findByStatusIn(java.util.List<BidStatus> statuses);",
    "DriverBidRepository": "java.util.List<DriverBid> findByBidRequestId(String bidRequestId); java.util.List<DriverBid> findByDriverId(String driverId);",
    "DriverBadgeProfileRepository": "java.util.Optional<DriverBadgeProfile> findByDriverId(String driverId);",
    "GroupRideRepository": "java.util.List<GroupRide> findByStatusIn(java.util.List<GroupRideStatus> statuses);",
    "GroupRideMemberRepository": "java.util.List<GroupRideMember> findByGroupRideId(String groupRideId); java.util.List<GroupRideMember> findByUserId(String userId);",
    "ShareTripSessionRepository": "java.util.Optional<ShareTripSession> findByRideId(String rideId); java.util.List<ShareTripSession> findAllByOrderByCreatedAtDesc();",
    "ShareTripEventRepository": "java.util.List<ShareTripEvent> findBySessionId(String sessionId);",
    "ReferralProfileRepository": "java.util.Optional<ReferralProfile> findByOwnerId(String ownerId); java.util.Optional<ReferralProfile> findByCode(String code);",
    "ReferralInviteRepository": "java.util.List<ReferralInvite> findByProfileId(String profileId);",
    "NotificationPreferenceRepository": "java.util.Optional<NotificationPreference> findByUserId(String userId);"
};

for (const [repoName, methodsStr] of Object.entries(repos)) {
    const entityName = repoName.replace("Repository", "");
    const methodsArr = methodsStr.split(";").map(m => m.trim()).filter(m => m.length > 0);
    const methodLines = [];
    
    for (const m of methodsArr) {
        methodLines.push(`    ${m};`);
    }
        
    const methodsJoined = methodLines.join("\n");
    
    const content = `package ng.gidiride.repository;

import ng.gidiride.model.${entityName};
import ng.gidiride.model.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${repoName} extends JpaRepository<${entityName}, String> {
${methodsJoined}
}
`;
    fs.writeFileSync(path.join(reposDir, `${repoName}.java`), content);
}
