package ng.gidiride.dto;
import lombok.Data;
import java.time.LocalDateTime;
@Data
public class TripDto {
    private String id;
    private String route;
    private double amount;
    private LocalDateTime date;
    private String payoutStatus;
}
