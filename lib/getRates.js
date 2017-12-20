const _ = require("lodash");
const Yelp = require("yelp-fusion");
const ShipEngine = require("shipengine");

const yelpClient = Yelp.client(process.env.YELP_API_KEY);
const shipEngine = new ShipEngine.ShipEngine(process.env.SHIP_ENGINE_API_KEY);

/**
 * Returns an array of shipping rates from ShipEngine for the specified shipment criteria.
 *
 * @param {string} from - The package's starting location (e.g. "London", "Austin, Texas", "90210", etc.)
 * @param {string} from - The destination location (e.g. "London", "Austin, Texas", "90210", etc.)
 * @param {number} weightAmount - The package's weight, in whatever unit
 * @param {string} unit - The unit of weight (e.g. "lb", "kg", "ounce", "pound", etc.)
 *
 * @returns {object[]} - Returns an array of rate objects from ShipEngine (https://docs.shipengine.com/docs)
 */
async function getRates (from, to, weightAmount, weightUnit) {
  // Convert the addresses from strings to ShipEngine.Address objects
  let ship_from = await normalizeAddress(from);
  let ship_to = await normalizeAddress(to);

  // Create a ShipEngine.Package object of the correct weight
  let weight = normalizeWeight(weightAmount, weightUnit);
  let parcel = new ShipEngine.Package(weight);

  // Get the carriers that are configured for your ShipEngine account
  let { carriers } = await shipEngine.getCarriers();
  let carrier_ids = _.map(carriers, "carrier_id");

  // Create a shipment with sender, recipient, and package
  let shipment = new ShipEngine.Shipment({ ship_from, ship_to, packages: [parcel] });

  // Let ShipEngine attempt to correct any invalid/missing parts of the address
  shipment.validate_address = "validate_and_clean";

  // Get shipping rates for this shipment from these carriers
  let { rate_response } = await shipEngine.getRates(shipment, { carrier_ids });

  if (rate_response.rates.length > 0) {
    return rate_response.rates;
  }
  else {
    // No rates were returned, so fallback to "invalid_rates".  These rates are for services
    // that aren't configured for your account (e.g. international, freight, etc.)
    return rate_response.invalid_rates;
  }
}

/**
 * Converts a string location to a ShipEngine.Address object using the Yelp API.
 *
 * @param {string} location - The human-friendly location (e.g. "New York", "Austin, Texas", "90210")
 * @returns {ShipEngine.Address}
 */
async function normalizeAddress (location) {
  // Search Yelp for the business that best matches the location
  let response = await yelpClient.search({ location, limit: 1 });
  let business = response.jsonBody.businesses[0] || { location: {} };

  return new ShipEngine.Address(
    business.name || "",
    business.location.city || "",
    business.location.state || "",
    business.location.zip_code || "",
    business.location.country || "",
    business.location.address1 || "",
    business.location.address2 || "",
    business.phone || ""
  );
}

/**
 * Converts a weight and unit into the format that's required by ShipEngine.
 *
 * @param {number} value - The weight amount, in whatever unit
 * @param {string} unit - The weight unit or abbreviation (e.g. "pound", "lb", "kilogram", "kg", etc.)
 */
function normalizeWeight (value, unit) {
  switch (unit.toLowerCase()) {
    case "oz":
      unit = "ounce";
      break;
    case "lb":
      unit = "pound";
      break;
    case "g":
      unit = "gram";
      break;
    case "kg":
    case "kilo":
      unit = "kilogram";
      break;
  }

  return { value, unit };
}

module.exports = getRates;
