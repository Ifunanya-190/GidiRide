package ng.gidiride.dto;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;

    public ApiResponse() {
    }

    public ApiResponse(boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<T>(true, data, "Success");
    }
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<T>(false, null, message);
    }
}
