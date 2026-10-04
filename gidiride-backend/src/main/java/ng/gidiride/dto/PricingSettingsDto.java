package ng.gidiride.dto;
import lombok.Data;
import java.util.List;
import java.time.LocalDateTime;
@Data
public class PricingSettingsDto {
    private List<PricingRuleDto> rules;
    private boolean globalSurgeEnabled;
    private List<HotZoneDto> hotZones;
    private LocalDateTime updatedAt;
}
