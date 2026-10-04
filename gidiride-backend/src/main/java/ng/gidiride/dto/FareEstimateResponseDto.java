package ng.gidiride.dto;
import lombok.Data;
@Data
public class FareEstimateResponseDto {
    private String id;
    private LocationDto pickup;
    private LocationDto dropoff;
    private String rideType;
    private String paymentMethod;
    private double distanceKm;
    private int durationMin;
    private double baseFare;
    private double distanceFare;
    private double surge;
    private double serviceFee;
    private double totalFare;
    private String note;
}
