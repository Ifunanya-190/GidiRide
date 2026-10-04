# GidiRide Backend Integration Checklist

This frontend is now structured so mock/local fallback can be disabled when Spring Boot is ready.

## Production switch

Create `.env.production`:

```env
VITE_API_BASE_URL=https://api.gidiride.ng/api
VITE_DISABLE_DEMO_FALLBACK=true
VITE_SHOW_DEMO_BANNER=false
VITE_GOOGLE_MAPS_API_KEY=your_key
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxx
```

## Endpoint groups already used by the frontend

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`

### Admin
- `GET /api/admin/stats`
- `GET /api/admin/users?role=RIDER|DRIVER`
- `PATCH /api/admin/users/{id}/ban`
- `PATCH /api/admin/users/{id}/unban`
- `PATCH /api/admin/drivers/{id}/kyc/approve`
- `PATCH /api/admin/drivers/{id}/kyc/reject`
- `GET /api/admin/pricing`
- `PUT /api/admin/pricing`
- `GET /api/admin/disputes`
- `GET /api/admin/sos`
- `GET /api/admin/analytics`

### Rider
- `POST /api/rider/rides/estimate`
- `POST /api/rider/rides/request`
- `GET /api/rider/rides/current`
- `PATCH /api/rider/rides/{id}/status`
- `GET /api/rider/rides/history`
- `POST /api/rider/rides/{rideId}/review`
- `GET /api/rider/profile/settings`
- `PUT /api/rider/profile/settings`
- `GET /api/rider/wallet`
- `POST /api/rider/wallet/top-up`
- `GET /api/rider/wallet/transactions`
- `GET /api/rider/payment-methods`

### Driver
- `GET /api/driver/dashboard`
- `GET /api/driver/profile`
- `POST /api/driver/kyc`
- `PATCH /api/driver/status`
- `GET /api/driver/ride-requests`
- `PATCH /api/driver/ride-requests/{id}`
- `GET /api/driver/trips/active`
- `PATCH /api/driver/trips/active/status`
- `GET /api/driver/earnings`
- `GET /api/driver/withdrawals`
- `POST /api/driver/withdrawals`

### Safety/support
- `POST /api/support/disputes`
- `POST /api/safety/sos`
- `POST /api/safety/share-trip`
- `POST /api/rides/{rideId}/destination-verification`

### Lagos features
- `POST /api/rider/bid-fares`
- `GET /api/rider/bid-fares`
- `GET /api/driver/bid-fares`
- `POST /api/driver/bid-fares/{bidRequestId}/bids`
- `POST /api/rides/fuel-split`
- `POST /api/rider/tips`
- `GET /api/driver/badges`
- `GET /api/rider/group-rides`
- `POST /api/rider/group-rides`
- `POST /api/rider/group-rides/{id}/join`
- `GET /api/rider/pay-later`
- `POST /api/rider/pay-later/activate`

### Realtime/STOMP plan
Use Spring Boot STOMP topics:

- `/topic/rides/{rideId}` ride status and driver assignment
- `/topic/rides/{rideId}/location` driver location updates
- `/topic/drivers/{driverId}/requests` incoming ride requests
- `/topic/admin/safety` SOS/dispute alerts
- `/app/driver/location` driver publishes location
- `/app/rides/{rideId}/status` rider/driver status events

### Paystack plan
Keep secret keys server-side only.

- `POST /api/payments/paystack/initialize`
- `GET /api/payments/paystack/verify/{reference}`
- `POST /api/payments/paystack/webhook`
- `POST /api/driver/withdrawals`

### Google Maps plan
Replace `src/shared/components/LagosMap.tsx` with Google Maps JavaScript API when key is available.
The current component is a branded fallback, not the final map engine.
