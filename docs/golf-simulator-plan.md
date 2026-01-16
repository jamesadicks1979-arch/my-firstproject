# Golf Simulator Business Draft

## Known inputs (from current notes)
- Rent: GBP 2,080 per month.
- Golf simulator financing: 2 sims at GBP 2,000 per month each for 12 months (GBP 4,000 total), then owned.
- Revenue areas planned:
  - 2 dart bays (charged out).
  - PlayStation area and racing driving sims.
  - Poker room available for rental.
  - Drinks area to watch football (Sky Sports).
  - Pool table (charged out).

## Fixed costs (based on current notes)
| Item | Monthly cost | Duration | Notes |
| --- | --- | --- | --- |
| Rent | GBP 2,080 | Ongoing | Monthly lease cost. |
| Golf simulator financing | GBP 4,000 | 12 months | 2 sims x GBP 2,000 per month. |
| Total fixed (months 1-12) | GBP 6,080 | 12 months | Rent + simulator financing. |
| Total fixed (month 13+) | GBP 2,080 | Ongoing | Rent only, assuming no other fixed costs. |

## Operating schedule (for revenue modeling)
- Open 30 days per month.
- Sunday to Thursday: 12:00 to 22:00 (10 hours).
- Friday and Saturday: 12:00 to 00:00 (12 hours).
- Weekly open hours: 5 * 10 + 2 * 12 = 74 hours.
- Monthly hours can be estimated by scaling weekly hours to 30 days.

## Revenue model placeholders
### Dart bays
- Count: 2
- Price per hour: GBP 25
- Hours open per day: 10 (Sun-Thu) / 12 (Fri-Sat)
- Days open per month: 30
- Utilization rate: TBD
- Monthly revenue formula:
  - 2 * price_per_hour * hours_per_day * days_per_month * utilization_rate

### PlayStation + racing sims area
- Pricing model: Hourly per person
- Price per person per hour: GBP 5
- Seats/stations: TBD
- Hours open per day: 10 (Sun-Thu) / 12 (Fri-Sat)
- Days open per month: 30
- Utilization rate: TBD
- Monthly revenue formula (if hourly):
  - stations * price_per_person_per_hour * hours_per_day * days_per_month * utilization_rate

### Pool table
- Count: 1
- Price per hour: GBP 15
- Hours open per day: 10 (Sun-Thu) / 12 (Fri-Sat)
- Days open per month: 30
- Utilization rate: TBD
- Monthly revenue formula:
  - price_per_hour * hours_per_day * days_per_month * utilization_rate

### Drinks area (football viewing)
- Pricing model: Entry fee
- Price before 6pm: GBP 25 per person
- Price after 6pm: GBP 35 per person
- Average guests before 6pm: TBD
- Average guests after 6pm: TBD
- Days open per month: 30
- Monthly revenue formula:
  - (price_before_6pm * guests_before_6pm + price_after_6pm * guests_after_6pm) * days_per_month

### Poker room rental
- Rental price (per hour or per session): TBD
- Average bookings per month: TBD
- Monthly revenue formula:
  - rental_price * bookings_per_month

## Other recurring costs to confirm
- Staffing wages, taxes, and benefits (2 staff) - TBD monthly total.
- Utilities (power, internet).
- Insurance and liability coverage.
- Maintenance/service contracts for sims.
- Cleaning and consumables.
- Payment processing fees.
- Marketing and advertising.
- Licenses/permits and business rates.
- Sky Sports subscription for football viewing.

## Next details needed
- Pricing for each revenue area.
- Expected opening hours and days per month.
- Expected utilization or booking rates.
- Staffing plan and monthly payroll estimate.
- One-time buildout or equipment costs not yet listed.
