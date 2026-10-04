package ng.gidiride.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.Collections;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import ng.gidiride.dto.*;
import ng.gidiride.repository.*;
import ng.gidiride.model.*;
import ng.gidiride.model.enums.*;
import ng.gidiride.exception.GidiRideException;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final WalletAccountRepository walletAccountRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final SavedPaymentMethodRepository savedPaymentMethodRepository;
    private final DriverWithdrawalRepository driverWithdrawalRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final HotZoneRepository hotZoneRepository;

    public WalletDto getWallet(String userId) { return new WalletDto(); }
    public List<TransactionDto> getTransactions(String userId) { return Collections.emptyList(); }
    public TopUpResponseDto topUp(String userId, TopUpRequestDto request) { return new TopUpResponseDto(); }
    public List<SavedPaymentMethod> getPaymentMethods(String userId) { return Collections.emptyList(); }
    public List<DriverWithdrawal> getDriverWithdrawals(String driverId) { return Collections.emptyList(); }
    public DriverWithdrawal requestWithdrawal(String driverId, WithdrawalRequestDto request) { return new DriverWithdrawal(); }

    public PricingSettingsDto getPricing() { 
        List<PricingRule> dbRules = pricingRuleRepository.findAll();
        if (dbRules.isEmpty()) {
            dbRules = List.of(
                new PricingRule(null, RideType.BIKE, "Bike", 200, 50, 20, 1.0, 0, true),
                new PricingRule(null, RideType.ECONOMY, "Economy", 500, 100, 50, 1.0, 0, true),
                new PricingRule(null, RideType.PREMIUM, "Premium", 1000, 200, 100, 1.0, 0, true)
            );
            dbRules = pricingRuleRepository.saveAll(dbRules);
        }
        List<HotZone> dbZones = hotZoneRepository.findAll();

        PricingSettingsDto dto = new PricingSettingsDto();
        dto.setRules(dbRules.stream().map(this::mapToPricingRuleDto).collect(Collectors.toList()));
        dto.setHotZones(dbZones.stream().map(this::mapToHotZoneDto).collect(Collectors.toList()));
        dto.setGlobalSurgeEnabled(true);
        dto.setUpdatedAt(LocalDateTime.now());
        return dto;
    }

    public PricingSettingsDto savePricing(PricingSettingsDto settings) { 
        if (settings.getRules() != null) {
            for (PricingRuleDto rDto : settings.getRules()) {
                pricingRuleRepository.findByRideType(RideType.valueOf(rDto.getRideType().toUpperCase()))
                    .ifPresent(r -> {
                        r.setBaseFare(rDto.getBaseFare());
                        r.setPerKm(rDto.getPerKm());
                        r.setServiceFee(rDto.getServiceFee());
                        r.setSurgeMultiplier(rDto.getSurgeMultiplier());
                        r.setFuelAdjustment(rDto.getFuelAdjustment());
                        r.setEnabled(rDto.isEnabled());
                        pricingRuleRepository.save(r);
                    });
            }
        }
        if (settings.getHotZones() != null) {
            hotZoneRepository.deleteAll();
            List<HotZone> newZones = settings.getHotZones().stream().map(dto -> {
                HotZone zone = new HotZone();
                zone.setName(dto.getName());
                zone.setMultiplier(dto.getMultiplier());
                zone.setActive(dto.isActive());
                return zone;
            }).collect(Collectors.toList());
            hotZoneRepository.saveAll(newZones);
        }
        // we can assume global surge is a system variable, maybe not stored yet, but we reflect it back
        PricingSettingsDto updated = getPricing();
        updated.setGlobalSurgeEnabled(settings.isGlobalSurgeEnabled());
        return updated;
    }

    public List<DriverWithdrawal> getAllWithdrawals() { 
        return driverWithdrawalRepository.findAllByOrderByCreatedAtDesc(); 
    }
    
    public DriverWithdrawal approveWithdrawal(String id) { 
        DriverWithdrawal w = driverWithdrawalRepository.findById(id).orElseThrow(() -> new GidiRideException(HttpStatus.NOT_FOUND, "Not found"));
        w.setStatus(WithdrawalStatus.PAID);
        return driverWithdrawalRepository.save(w);
    }
    
    public DriverWithdrawal rejectWithdrawal(String id, String reason) { 
        DriverWithdrawal w = driverWithdrawalRepository.findById(id).orElseThrow(() -> new GidiRideException(HttpStatus.NOT_FOUND, "Not found"));
        w.setStatus(WithdrawalStatus.REJECTED);
        w.setRejectionReason(reason);
        
        WalletAccount wallet = walletAccountRepository.findByUserId(w.getDriverId()).orElse(null);
        if (wallet != null) {
            wallet.setBalance(wallet.getBalance() + w.getAmount());
            wallet.setUpdatedAt(LocalDateTime.now());
            walletAccountRepository.save(wallet);
        }
        
        return driverWithdrawalRepository.save(w);
    }

    public void creditWallet(String userId, double amount) {
        WalletAccount wallet = walletAccountRepository.findByUserId(userId).orElse(null);
        if (wallet == null) {
            wallet = new WalletAccount();
            wallet.setUserId(userId);
            wallet.setBalance(0);
        }
        wallet.setBalance(wallet.getBalance() + amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletAccountRepository.save(wallet);
    }

    private PricingRuleDto mapToPricingRuleDto(PricingRule r) {
        PricingRuleDto d = new PricingRuleDto();
        d.setRideType(r.getRideType().name());
        d.setLabel(r.getLabel());
        d.setBaseFare(r.getBaseFare());
        d.setPerKm(r.getPerKm());
        d.setServiceFee(r.getServiceFee());
        d.setSurgeMultiplier(r.getSurgeMultiplier());
        d.setFuelAdjustment(r.getFuelAdjustment());
        d.setEnabled(r.isEnabled());
        return d;
    }

    private HotZoneDto mapToHotZoneDto(HotZone z) {
        HotZoneDto d = new HotZoneDto();
        d.setId(z.getId());
        d.setName(z.getName());
        d.setMultiplier(z.getMultiplier());
        d.setActive(z.isActive());
        return d;
    }
}
