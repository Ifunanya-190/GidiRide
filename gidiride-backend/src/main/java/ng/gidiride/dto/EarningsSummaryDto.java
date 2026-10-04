package ng.gidiride.dto;
import lombok.Data;
import java.util.List;
@Data
public class EarningsSummaryDto {
    private double today;
    private double week;
    private double month;
    private double walletBalance;
    private double withdrawalsPending;
    private List<TripDto> trips;
}
