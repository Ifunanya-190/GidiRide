package ng.gidiride.dto;
import lombok.Data;
import java.time.LocalDateTime;
@Data
public class WalletDto {
    private String userId;
    private double balance;
    private String currency;
    private String paystackCustomerCode;
    private LocalDateTime updatedAt;
}
