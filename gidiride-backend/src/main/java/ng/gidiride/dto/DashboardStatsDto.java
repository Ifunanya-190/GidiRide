package ng.gidiride.dto;
import lombok.Data;
@Data
public class DashboardStatsDto {
    private long totalUsers;
    private long totalRiders;
    private long totalDrivers;
    private long bannedUsers;
    private long activeDrivers;
    private long completedRides;
    private double revenueToday;
}
