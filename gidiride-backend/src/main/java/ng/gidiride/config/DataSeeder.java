package ng.gidiride.config;

import ng.gidiride.model.*;
import ng.gidiride.model.enums.*;
import ng.gidiride.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PricingRuleRepository pricingRuleRepository;

    @Autowired
    private HotZoneRepository hotZoneRepository;

    @Autowired
    private WalletAccountRepository walletAccountRepository;

    @Autowired
    private DriverProfileRepository driverProfileRepository;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private DriverDocumentRepository driverDocumentRepository;

    @Autowired
    private DisputeRepository disputeRepository;

    @Autowired
    private SosAlertRepository sosAlertRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedUsers();
            seedPricingRules();
            seedHotZones();
            seedDisputes();
            seedSosAlerts();
        }
    }

    private void seedUsers() {
        User admin = createUser("admin-001", "GidiRide Control Room", "admin@gidiride.ng", "+2348010000001", "GidiRide@123", Role.ADMIN, Gender.OTHER, false, null, null, 0, 0.0, null);
        User rider1 = createUser("rider-101", "Adaeze Okonkwo", "ada@gidiride.ng", "+2348034561180", "password123", Role.RIDER, Gender.FEMALE, false, null, null, 14, 4.8, null);
        User rider2 = createUser("rider-102", "Musa Balogun", "musa@gidiride.ng", "+2348129943317", "password123", Role.RIDER, Gender.MALE, false, null, null, 7, 4.4, null);
        User rider3 = createUser("rider-103", "Tomi Akinyele", "tomi@gidiride.ng", "+2347013332200", "password123", Role.RIDER, Gender.FEMALE, true, "Repeated safety reports pending review", null, 29, 3.2, null);
        User driver1 = createUser("driver-201", "Kunle Adeyemi", "kunle@gidiride.ng", "+2349057771201", "password123", Role.DRIVER, Gender.MALE, false, null, KycStatus.APPROVED, 86, 4.9, "Toyota Corolla • EKY-821KT");
        User driver2 = createUser("driver-202", "Blessing Johnson", "blessing@gidiride.ng", "+2348094451302", "password123", Role.DRIVER, Gender.FEMALE, false, null, KycStatus.PENDING, 12, 4.7, "Honda Accord • BDG-774HN");
        User driver3 = createUser("driver-203", "Emeka Nwosu", "emeka@gidiride.ng", "+2348187800090", "password123", Role.DRIVER, Gender.MALE, true, "Admin safety lock after dispute ticket #GR-5521", KycStatus.APPROVED, 131, 3.7, "Lexus ES350 • FST-102AB");

        userRepository.saveAll(Arrays.asList(admin, rider1, rider2, rider3, driver1, driver2, driver3));

        // Seed wallet accounts for all riders
        Arrays.asList(rider1, rider2, rider3).forEach(rider -> {
            WalletAccount wallet = new WalletAccount();
            wallet.setId("wallet-" + rider.getId());
            wallet.setUserId(rider.getId());
            wallet.setBalance(0.0);
            wallet.setCurrency("NGN");
            wallet.setUpdatedAt(LocalDateTime.now());
            walletAccountRepository.save(wallet);
        });

        // Seed Driver profiles
        DriverProfile dp1 = new DriverProfile();
        dp1.setId("dp-201");
        dp1.setUserId(driver1.getId());
        dp1.setFullName(driver1.getFullName());
        dp1.setPhone(driver1.getPhone());
        dp1.setEmail(driver1.getEmail());
        dp1.setVehicleMake("Toyota");
        dp1.setVehicleModel("Corolla");
        dp1.setPlateNumber("EKY-821KT");
        dp1.setKycStatus(KycStatus.APPROVED);
        dp1.setOnlineStatus(DriverOnlineStatus.OFFLINE);
        driverProfileRepository.save(dp1);

        DriverProfile dp2 = new DriverProfile();
        dp2.setId("dp-202");
        dp2.setUserId(driver2.getId());
        dp2.setFullName(driver2.getFullName());
        dp2.setPhone(driver2.getPhone());
        dp2.setEmail(driver2.getEmail());
        dp2.setVehicleMake("Honda");
        dp2.setVehicleModel("Accord");
        dp2.setPlateNumber("BDG-774HN");
        dp2.setKycStatus(KycStatus.PENDING);
        dp2.setOnlineStatus(DriverOnlineStatus.OFFLINE);
        driverProfileRepository.save(dp2);

        // Driver 3 profile (was missing)
        DriverProfile dp3 = new DriverProfile();
        dp3.setId("dp-203");
        dp3.setUserId(driver3.getId());
        dp3.setFullName(driver3.getFullName());
        dp3.setPhone(driver3.getPhone());
        dp3.setEmail(driver3.getEmail());
        dp3.setVehicleMake("Lexus");
        dp3.setVehicleModel("ES350");
        dp3.setPlateNumber("FST-102AB");
        dp3.setKycStatus(KycStatus.APPROVED);
        dp3.setOnlineStatus(DriverOnlineStatus.OFFLINE);
        driverProfileRepository.save(dp3);

        // Seed wallet accounts for all drivers
        Arrays.asList(driver1, driver2, driver3).forEach(driver -> {
            WalletAccount dw = new WalletAccount();
            dw.setId("wallet-" + driver.getId());
            dw.setUserId(driver.getId());
            dw.setBalance(0.0);
            dw.setCurrency("NGN");
            dw.setUpdatedAt(LocalDateTime.now());
            walletAccountRepository.save(dw);
        });

        // Seed sample completed rides for driver-201 so dashboard & earnings show real data
        seedSampleRides(rider1, driver1, dp1);
    }

    private User createUser(String id, String fullName, String email, String phone, String password, Role role, Gender gender, boolean banned, String banReason, KycStatus kycStatus, int totalRides, double rating, String vehicle) {
        User user = new User();
        user.setId(id);
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setGender(gender);
        user.setBanned(banned);
        user.setBanReason(banReason);
        user.setKycStatus(kycStatus);
        user.setTotalRides(totalRides);
        user.setRating(rating);
        user.setVehicle(vehicle);
        user.setCreatedAt(LocalDateTime.now());
        // Set a realistic lastActiveAt so users don't show "Never signed in"
        user.setLastActiveAt(LocalDateTime.now().minusHours((long)(Math.random() * 48)));
        return user;
    }

    private void seedPricingRules() {
        PricingRule bike = new PricingRule();
        bike.setId("pr-bike");
        bike.setRideType(RideType.BIKE);
        bike.setLabel("BIKE");
        bike.setBaseFare(650.0);
        bike.setPerKm(180.0);
        bike.setServiceFee(90.0);
        bike.setSurgeMultiplier(1.05);
        bike.setFuelAdjustment(0.0);
        bike.setEnabled(true);

        PricingRule economy = new PricingRule();
        economy.setId("pr-economy");
        economy.setRideType(RideType.ECONOMY);
        economy.setLabel("ECONOMY");
        economy.setBaseFare(1200.0);
        economy.setPerKm(330.0);
        economy.setServiceFee(120.0);
        economy.setSurgeMultiplier(1.08);
        economy.setFuelAdjustment(0.0);
        economy.setEnabled(true);

        PricingRule premium = new PricingRule();
        premium.setId("pr-premium");
        premium.setRideType(RideType.PREMIUM);
        premium.setLabel("PREMIUM");
        premium.setBaseFare(2400.0);
        premium.setPerKm(520.0);
        premium.setServiceFee(180.0);
        premium.setSurgeMultiplier(1.12);
        premium.setFuelAdjustment(0.0);
        premium.setEnabled(true);

        pricingRuleRepository.saveAll(Arrays.asList(bike, economy, premium));
    }

    private void seedHotZones() {
        HotZone lekki = new HotZone();
        lekki.setId("hz-lekki");
        lekki.setName("lekki-phase-1");
        lekki.setMultiplier(1.18);
        lekki.setActive(true);

        HotZone vi = new HotZone();
        vi.setId("hz-vi");
        vi.setName("vi");
        vi.setMultiplier(1.16);
        vi.setActive(true);

        HotZone airport = new HotZone();
        airport.setId("hz-airport");
        airport.setName("airport");
        airport.setMultiplier(1.14);
        airport.setActive(false);

        hotZoneRepository.saveAll(Arrays.asList(lekki, vi, airport));
    }

    private void seedSampleRides(User rider, User driver, DriverProfile dp) {
        // 2 completed rides today, 1 yesterday — gives real dashboard and earnings data
        Ride r1 = new Ride();
        r1.setId("ride-seed-1");
        r1.setRiderId(rider.getId());
        r1.setRiderName(rider.getFullName());
        r1.setPickupId("loc-lekki"); r1.setPickupName("Lekki Phase 1"); r1.setPickupArea("Lekki"); r1.setPickupLat(6.4510); r1.setPickupLng(3.4740);
        r1.setDropoffId("loc-vi"); r1.setDropoffName("Victoria Island"); r1.setDropoffArea("VI"); r1.setDropoffLat(6.4281); r1.setDropoffLng(3.4219);
        r1.setRideType(RideType.ECONOMY);
        r1.setPaymentMethod(PaymentMethod.CASH);
        r1.setDistanceKm(8.2); r1.setDurationMin(22);
        r1.setBaseFare(1200); r1.setDistanceFare(2706); r1.setSurge(1.08); r1.setServiceFee(120); r1.setTotalFare(4150);
        r1.setStatus(RideStatus.COMPLETED);
        r1.setRequestedAt(LocalDateTime.now().minusHours(3));
        r1.setDriverId(driver.getId()); r1.setDriverName(dp.getFullName()); r1.setDriverPhone(dp.getPhone());
        r1.setDriverVehicle(dp.getVehicleMake() + " " + dp.getVehicleModel()); r1.setDriverPlateNumber(dp.getPlateNumber());
        r1.setDriverRating(driver.getRating()); r1.setDriverEtaMin(7);
        rideRepository.save(r1);

        Ride r2 = new Ride();
        r2.setId("ride-seed-2");
        r2.setRiderId(rider.getId());
        r2.setRiderName(rider.getFullName());
        r2.setPickupId("loc-ikeja"); r2.setPickupName("Ikeja GRA"); r2.setPickupArea("Ikeja"); r2.setPickupLat(6.5833); r2.setPickupLng(3.3500);
        r2.setDropoffId("loc-yaba"); r2.setDropoffName("Yaba"); r2.setDropoffArea("Yaba"); r2.setDropoffLat(6.5095); r2.setDropoffLng(3.3711);
        r2.setRideType(RideType.ECONOMY);
        r2.setPaymentMethod(PaymentMethod.CARD);
        r2.setDistanceKm(11.5); r2.setDurationMin(35);
        r2.setBaseFare(1200); r2.setDistanceFare(3795); r2.setSurge(1.0); r2.setServiceFee(120); r2.setTotalFare(5100);
        r2.setStatus(RideStatus.COMPLETED);
        r2.setRequestedAt(LocalDateTime.now().minusHours(1));
        r2.setDriverId(driver.getId()); r2.setDriverName(dp.getFullName()); r2.setDriverPhone(dp.getPhone());
        r2.setDriverVehicle(dp.getVehicleMake() + " " + dp.getVehicleModel()); r2.setDriverPlateNumber(dp.getPlateNumber());
        r2.setDriverRating(driver.getRating()); r2.setDriverEtaMin(5);
        rideRepository.save(r2);

        // Credit driver wallet with net earnings from seeded rides
        WalletAccount driverWallet = walletAccountRepository.findByUserId(driver.getId()).orElse(null);
        if (driverWallet != null) {
            double netR1 = r1.getTotalFare() - r1.getServiceFee(); // 4150 - 120 = 4030
            double netR2 = r2.getTotalFare() - r2.getServiceFee(); // 5100 - 120 = 4980
            driverWallet.setBalance(netR1 + netR2); // 9010
            driverWallet.setUpdatedAt(LocalDateTime.now());
            walletAccountRepository.save(driverWallet);
        }

        // Seed sample driver documents for driver-201
        DriverDocument doc1 = new DriverDocument();
        doc1.setId("doc-license-201");
        doc1.setDriverProfileId(dp.getId());
        doc1.setLabel("Driver License");
        doc1.setFileName("kunle-license.jpg");
        doc1.setUploadedAt(LocalDateTime.now().minusDays(30));
        doc1.setStatus(KycStatus.APPROVED);
        driverDocumentRepository.save(doc1);

        DriverDocument doc2 = new DriverDocument();
        doc2.setId("doc-nin-201");
        doc2.setDriverProfileId(dp.getId());
        doc2.setLabel("NIN Slip");
        doc2.setFileName("kunle-nin.pdf");
        doc2.setUploadedAt(LocalDateTime.now().minusDays(30));
        doc2.setStatus(KycStatus.APPROVED);
        driverDocumentRepository.save(doc2);

        DriverDocument doc3 = new DriverDocument();
        doc3.setId("doc-papers-201");
        doc3.setDriverProfileId(dp.getId());
        doc3.setLabel("Vehicle Papers");
        doc3.setFileName("toyota-corolla-papers.pdf");
        doc3.setUploadedAt(LocalDateTime.now().minusDays(30));
        doc3.setStatus(KycStatus.APPROVED);
        driverDocumentRepository.save(doc3);
    }

    private void seedDisputes() {
        // Seed ride first if needed
        if (rideRepository.count() == 0) {
            Ride ride = new Ride();
            ride.setId("ride-seed-001");
            ride.setRiderId("rider-101");
            ride.setRiderName("Adaeze Okonkwo");
            ride.setDriverId("driver-201");
            ride.setDriverName("Kunle Adeyemi");
            ride.setDriverPhone("+2349057771201");
            ride.setPickupArea("Yaba");
            ride.setPickupName("Yaba Bus Stop");
            ride.setDropoffArea("Lekki Phase 1");
            ride.setDropoffName("Lekki Toll Gate");
            ride.setRideType(RideType.ECONOMY);
            ride.setPaymentMethod(PaymentMethod.CASH);
            ride.setTotalFare(3850);
            ride.setBaseFare(1500);
            ride.setDistanceFare(1800);
            ride.setSurge(250);
            ride.setServiceFee(300);
            ride.setDistanceKm(18.5);
            ride.setDurationMin(35);
            ride.setStatus(RideStatus.COMPLETED);
            ride.setRequestedAt(LocalDateTime.now().minusHours(5));
            rideRepository.save(ride);

            Ride ride2 = new Ride();
            ride2.setId("ride-seed-002");
            ride2.setRiderId("rider-102");
            ride2.setRiderName("Musa Balogun");
            ride2.setDriverId("driver-203");
            ride2.setDriverName("Emeka Nwosu");
            ride2.setDriverPhone("+2348187800090");
            ride2.setPickupArea("Ikeja");
            ride2.setPickupName("Ikeja City Mall");
            ride2.setDropoffArea("Victoria Island");
            ride2.setDropoffName("Eko Atlantic");
            ride2.setRideType(RideType.PREMIUM);
            ride2.setPaymentMethod(PaymentMethod.CARD);
            ride2.setTotalFare(6200);
            ride2.setBaseFare(2500);
            ride2.setDistanceFare(3000);
            ride2.setSurge(400);
            ride2.setServiceFee(300);
            ride2.setDistanceKm(28.0);
            ride2.setDurationMin(50);
            ride2.setStatus(RideStatus.COMPLETED);
            ride2.setRequestedAt(LocalDateTime.now().minusHours(3));
            rideRepository.save(ride2);
        }

        Dispute d1 = new Dispute();
        d1.setId("disp-001");
        d1.setRideId("ride-seed-001");
        d1.setOpenedBy("Adaeze Okonkwo");
        d1.setOpenedByRole(Role.RIDER);
        d1.setCategory(DisputeCategory.FARE);
        d1.setDetails("I was charged extra for this ride and the driver was extremely noisy throughout the ride");
        d1.setStatus(DisputeStatus.OPEN);
        d1.setPriority(DisputePriority.HIGH);
        d1.setCreatedAt(LocalDateTime.now().minusHours(4));
        disputeRepository.save(d1);

        Dispute d2 = new Dispute();
        d2.setId("disp-002");
        d2.setRideId("ride-seed-002");
        d2.setOpenedBy("Musa Balogun");
        d2.setOpenedByRole(Role.RIDER);
        d2.setCategory(DisputeCategory.DRIVER);
        d2.setDetails("Driver took a longer route on purpose to increase the fare. GPS shows a 12km detour.");
        d2.setStatus(DisputeStatus.OPEN);
        d2.setPriority(DisputePriority.MEDIUM);
        d2.setCreatedAt(LocalDateTime.now().minusHours(2));
        disputeRepository.save(d2);
    }

    private void seedSosAlerts() {
        SosAlert sos = new SosAlert();
        sos.setId("sos-001");
        sos.setRideId("ride-seed-001");
        sos.setRiderId("rider-101");
        sos.setRiderName("Adaeze Okonkwo");
        sos.setDriverName("Kunle Adeyemi");
        sos.setRoute("Yaba -> Lekki Phase 1");
        sos.setStatus(SosStatus.ACTIVE);
        sos.setCreatedAt(LocalDateTime.now().minusHours(1));
        sos.setTriggeredBy("RIDER");
        sosAlertRepository.save(sos);
    }
}
