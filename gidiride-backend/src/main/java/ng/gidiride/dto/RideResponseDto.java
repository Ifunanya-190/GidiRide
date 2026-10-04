package ng.gidiride.dto;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;
@Data
@EqualsAndHashCode(callSuper = true)
public class RideResponseDto extends FareEstimateResponseDto {
    private String riderId;
    private String riderName;
    private String status;
    private LocalDateTime requestedAt;
    private DriverInfoDto driver;
    private SafetyDto safety;
}
