package ng.gidiride.dto;
import lombok.Data;
import java.time.LocalDateTime;
@Data
public class TransactionDto {
    private String id;
    private String userId;
    private String type;
    private double amount;
    private String status;
    private String provider;
    private String reference;
    private String description;
    private LocalDateTime createdAt;
}
