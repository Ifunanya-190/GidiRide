package ng.gidiride.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ng.gidiride.dto.*;
import ng.gidiride.repository.*;
import ng.gidiride.model.*;
import ng.gidiride.security.JwtTokenProvider;
import ng.gidiride.exception.GidiRideException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponseDto login(LoginRequest request) {
        User user = userRepository.findByEmailOrPhone(request.getEmailOrPhone(), request.getEmailOrPhone())
                .orElseThrow(() -> new GidiRideException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new GidiRideException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (user.isBanned()) {
            throw new GidiRideException(HttpStatus.FORBIDDEN, "Account suspended: " + user.getBanReason());
        }

        user.setLastActiveAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getId(), user.getRole().name(), user.getFullName());

        AuthResponseDto response = new AuthResponseDto();
        response.setToken(token);
        
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setFullName(user.getFullName());
        userDto.setEmail(user.getEmail());
        userDto.setPhone(user.getPhone());
        userDto.setRole(user.getRole().name());
        userDto.setGender(user.getGender() != null ? user.getGender().name() : null);
        userDto.setBanned(user.isBanned());
        userDto.setBanReason(user.getBanReason());
        userDto.setCreatedAt(user.getCreatedAt());
        userDto.setTotalRides(user.getTotalRides());
        userDto.setRating(user.getRating());
        
        response.setUser(userDto);
        return response;
    }

    public AuthResponseDto register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new GidiRideException(HttpStatus.CONFLICT, "Email already registered");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new GidiRideException(HttpStatus.CONFLICT, "Phone number already registered");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(ng.gidiride.model.enums.Role.valueOf(request.getRole()));
        if (request.getGender() != null && !request.getGender().isEmpty()) {
            user.setGender(ng.gidiride.model.enums.Gender.valueOf(request.getGender()));
        }
        user.setCreatedAt(LocalDateTime.now());
        user.setRating(5.0);
        user.setTotalRides(0);

        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getId(), user.getRole().name(), user.getFullName());

        AuthResponseDto response = new AuthResponseDto();
        response.setToken(token);

        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setFullName(user.getFullName());
        userDto.setEmail(user.getEmail());
        userDto.setPhone(user.getPhone());
        userDto.setRole(user.getRole().name());
        userDto.setGender(user.getGender() != null ? user.getGender().name() : null);
        userDto.setBanned(false);
        userDto.setCreatedAt(user.getCreatedAt());
        userDto.setTotalRides(0);
        userDto.setRating(5.0);

        response.setUser(userDto);
        return response;
    }
}
