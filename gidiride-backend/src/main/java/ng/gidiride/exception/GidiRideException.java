package ng.gidiride.exception;

import org.springframework.http.HttpStatus;

public class GidiRideException extends RuntimeException {
    private final HttpStatus status;

    public GidiRideException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
