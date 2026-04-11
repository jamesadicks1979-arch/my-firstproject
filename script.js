const spraysRange = document.getElementById("sprays-range");
const spraysValue = document.getElementById("sprays-value");
const grossSales = document.getElementById("gross-sales");
const venueShare = document.getElementById("venue-share");
const yearEl = document.getElementById("year");

const sprayPrice = 2;
const venueCut = 0.2;
const monthDays = 30;

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function updateEstimator() {
  const spraysPerNight = Number(spraysRange.value);
  const monthlyGross = spraysPerNight * sprayPrice * monthDays;
  const monthlyVenueShare = monthlyGross * venueCut;

  spraysValue.textContent = spraysPerNight.toString();
  grossSales.textContent = formatCurrency(monthlyGross);
  venueShare.textContent = formatCurrency(monthlyVenueShare);
}

spraysRange.addEventListener("input", updateEstimator);
updateEstimator();

yearEl.textContent = new Date().getFullYear().toString();
