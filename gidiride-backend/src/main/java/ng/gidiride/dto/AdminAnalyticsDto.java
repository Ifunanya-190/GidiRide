package ng.gidiride.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class AdminAnalyticsDto {
    private String generatedAt;
    private AnalyticsTotalsDto totals;
    private List<SeriesPointDto> revenueSeries;
    private List<SeriesPointDto> rideSeries;
    private List<SeriesPointDto> peakHours;
    private List<HeatMapPointDto> heatMap;
    private List<SeriesPointDto> paymentMix;
    private List<SeriesPointDto> featureUsage;

    @Data
    public static class AnalyticsTotalsDto {
        private long rides;
        private double revenue;
        private long riders;
        private long drivers;
        private long activeDrivers;
        private long disputes;
        private long sosAlerts;
        private long referrals;
    }

    @Data
    public static class SeriesPointDto {
        private String label;
        private double value;
    }

    @Data
    public static class HeatMapPointDto {
        private String id;
        private String area;
        private double intensity;
        private long rides;
        private double revenue;
        private double lat;
        private double lng;
    }
}
