package ng.gidiride.dto;
import lombok.Data;
@Data
public class DriverDashboardDto {
    private String onlineStatus;
    private String kycStatus;
    private int todayTrips;
    private double todayEarnings;
    private double weeklyEarnings;
    private double acceptanceRate;
    private double rating;
    private double walletBalance;
}
