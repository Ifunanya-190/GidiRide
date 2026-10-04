package ng.gidiride.dto;
import lombok.Data;
@Data
public class RegisterRequest {
    private String fullName;
    private String email;
    private String phone;
    private String password;
    private String role;
    private String gender;
}
