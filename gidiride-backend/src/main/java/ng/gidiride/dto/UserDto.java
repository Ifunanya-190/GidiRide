package ng.gidiride.dto;
import lombok.Data;
import java.time.LocalDateTime;
@Data
public class UserDto {
    private String id;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private String gender;
    private boolean banned;
    private String banReason;
    private LocalDateTime createdAt;
    private LocalDateTime lastActiveAt;
    private String kycStatus;
    private int totalRides;
    private double rating;
    private VehicleDto vehicle;

    @Data
    public static class VehicleDto {
        private String make;
        private String model;
        private String year;
        private String plateNumber;
        private String color;
    }
}
