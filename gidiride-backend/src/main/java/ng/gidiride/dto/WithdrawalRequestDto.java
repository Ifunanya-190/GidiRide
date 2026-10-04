package ng.gidiride.dto;
import lombok.Data;
@Data
public class WithdrawalRequestDto {
    private double amount;
    private String bankName;
    private String accountNumber;
    private String accountName;
}
