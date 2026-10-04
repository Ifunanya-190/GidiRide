package ng.gidiride.dto;
import lombok.Data;
@Data
public class AuthResponseDto {
    private String token;
    private UserDto user;
}
