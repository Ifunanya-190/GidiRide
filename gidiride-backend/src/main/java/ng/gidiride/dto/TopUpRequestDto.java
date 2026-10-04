package ng.gidiride.dto;
import lombok.Data;
@Data
public class TopUpRequestDto {
    private double amount;
    private String provider;
}
