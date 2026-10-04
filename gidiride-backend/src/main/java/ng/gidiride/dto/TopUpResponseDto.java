package ng.gidiride.dto;
import lombok.Data;
@Data
public class TopUpResponseDto {
    private String authorizationUrl;
    private String reference;
    private WalletDto wallet;
    private TransactionDto transaction;
}
