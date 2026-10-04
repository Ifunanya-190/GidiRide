package ng.gidiride.dto;
import lombok.Data;
@Data
public class FareEstimateRequestDto {
    private LocationDto pickup;
    private LocationDto dropoff;
    private String rideType;
    private String paymentMethod;
    private Boolean femaleDriverOnly;
    private Boolean maleDriverOnly;
}
