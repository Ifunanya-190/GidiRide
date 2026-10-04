package ng.gidiride.dto;
import lombok.Data;
@Data
public class DriverInfoDto {
    private String id;
    private String name;
    private String phone;
    private double rating;
    private Object vehicle;
    private String plateNumber;
    private int etaMin;
}
