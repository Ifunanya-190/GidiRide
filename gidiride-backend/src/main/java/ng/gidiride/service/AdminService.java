package ng.gidiride.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import ng.gidiride.dto.*;
import ng.gidiride.repository.*;
import ng.gidiride.model.*;
import ng.gidiride.model.enums.*;
import ng.gidiride.exception.GidiRideException;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final DriverProfileRepository driverProfileRepository;

    public DashboardStatsDto getStats() {
        DashboardStatsDto stats = new DashboardStatsDto();
        stats.setTotalUsers(userRepository.count());
        
        List<User> users = userRepository.findAll();
        stats.setTotalRiders(users.stream().filter(u -> u.getRole() == Role.RIDER).count());
        stats.setTotalDrivers(users.stream().filter(u -> u.getRole() == Role.DRIVER).count());
        stats.setBannedUsers(users.stream().filter(User::isBanned).count());
        
        stats.setActiveDrivers(driverProfileRepository.findAll().stream()
            .filter(d -> d.getOnlineStatus() == DriverOnlineStatus.ONLINE).count());
        
        stats.setCompletedRides(rideRepository.count());
        
        double rev = rideRepository.findAll().stream()
            .filter(r -> r.getStatus() == RideStatus.COMPLETED)
            .mapToDouble(Ride::getTotalFare)
            .sum();
        stats.setRevenueToday(rev);
        
        return stats;
    }

    public List<UserDto> getUsers(String roleStr) {
        List<User> users;
        if (roleStr != null && !roleStr.isEmpty()) {
            Role role = Role.valueOf(roleStr.toUpperCase());
            users = userRepository.findAll().stream().filter(u -> u.getRole() == role).collect(Collectors.toList());
        } else {
            users = userRepository.findAll();
        }
        return users.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public ng.gidiride.model.DriverProfile getDriverProfile(String driverId) {
        return driverProfileRepository.findByUserId(driverId).orElse(null);
    }

    public UserDto banUser(String userId, String reason) {
        User user = userRepository.findById(userId).orElseThrow(() -> new GidiRideException(HttpStatus.NOT_FOUND, "User not found"));
        user.setBanned(true);
        user.setBanReason(reason);
        return mapToDto(userRepository.save(user));
    }

    public UserDto unbanUser(String userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new GidiRideException(HttpStatus.NOT_FOUND, "User not found"));
        user.setBanned(false);
        user.setBanReason(null);
        return mapToDto(userRepository.save(user));
    }

    public UserDto warnUser(String userId, String reason) {
        User user = userRepository.findById(userId).orElseThrow(() -> new GidiRideException(HttpStatus.NOT_FOUND, "User not found"));
        user.setWarningMessage(reason);
        user.setWarningAt(LocalDateTime.now());
        user = userRepository.save(user);
        return mapToDto(user);
    }

    public UserDto approveDriverKyc(String userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new GidiRideException(HttpStatus.NOT_FOUND, "User not found"));
        user.setKycStatus(KycStatus.APPROVED);
        user = userRepository.save(user);

        driverProfileRepository.findByUserId(userId).ifPresent(profile -> {
            profile.setKycStatus(KycStatus.APPROVED);
            driverProfileRepository.save(profile);
        });
        return mapToDto(user);
    }

    public UserDto rejectDriverKyc(String userId, String reason) {
        User user = userRepository.findById(userId).orElseThrow(() -> new GidiRideException(HttpStatus.NOT_FOUND, "User not found"));
        user.setKycStatus(KycStatus.REJECTED);
        user = userRepository.save(user);

        driverProfileRepository.findByUserId(userId).ifPresent(profile -> {
            profile.setKycStatus(KycStatus.REJECTED);
            profile.setRejectionReason(reason);
            driverProfileRepository.save(profile);
        });
        return mapToDto(user);
    }

    public UserDto mapUserToDto(User user) { return mapToDto(user); }

    private UserDto mapToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole().name());
        dto.setGender(user.getGender() != null ? user.getGender().name() : null);
        dto.setBanned(user.isBanned());
        dto.setBanReason(user.getBanReason());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setLastActiveAt(user.getLastActiveAt());
        dto.setTotalRides(user.getTotalRides());
        dto.setRating(user.getRating());
        dto.setKycStatus(user.getKycStatus() != null ? user.getKycStatus().name() : null);
        
        if (user.getRole() == ng.gidiride.model.enums.Role.DRIVER) {
            driverProfileRepository.findByUserId(user.getId()).ifPresent(profile -> {
                if (profile.getKycStatus() != null) {
                    dto.setKycStatus(profile.getKycStatus().name());
                }
                UserDto.VehicleDto vehicle = new UserDto.VehicleDto();
                vehicle.setMake(profile.getVehicleMake());
                vehicle.setModel(profile.getVehicleModel());
                vehicle.setYear(profile.getVehicleYear());
                vehicle.setPlateNumber(profile.getPlateNumber());
                vehicle.setColor(profile.getVehicleColor());
                dto.setVehicle(vehicle);
            });
        }
        return dto;
    }
}
