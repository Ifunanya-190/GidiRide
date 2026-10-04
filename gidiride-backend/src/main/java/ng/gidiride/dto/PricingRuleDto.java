package ng.gidiride.dto;
import lombok.Data;
@Data
public class PricingRuleDto {
    private String rideType;
    private String label;
    private double baseFare;
    private double perKm;
    private double serviceFee;
    private double surgeMultiplier;
    private double fuelAdjustment;
    private boolean enabled;
}
