const _ = require("lodash");
const getRates = require("./getRates");

/**
 * Responds to a natural language message such as "How much to send a 3lb package from New York to London?"
 * with something like "It'll cost between $5.75 and $9.00 to send your 3lb package from New York to London".
 *
 * @param {string} message - The message to respond to
 * @returns {string} - The response message
 */
async function buildResponse (message) {
  // Parse the message into from/to addresses and package weight.
  let { from, to, weight, unit } = parseMessage(message);

  // Ask for more info if anything is missing
  if (!from || !to) {
    return "I need to know where you're shipping from and to";
  }
  else if (!weight || !unit) {
    return "I need to know the package weight and unit";
  }
  else {
    // We have all the data we need!  So get the shipping rates
    let rates = await getRates(from, to, weight, unit);

    if (rates.length === 0) {
      return `Sorry, but I don't know how much it'll cost to ship your ${weight} ${unit} package from ${from} to ${to}`;
    }
    else {
      let { minRate, maxRate } = getRateRange(rates);
      return `It'll cost between ${minRate} and ${maxRate} to ship your ${weight} ${unit} package from ${from} to ${to}`;
    }
  }
}

/**
 * Parses a natural language message such as "How much to send a 3lb package from New York to London?"
 * and returns the locations ("New York" and "London") the weight (3) and the unit ("lb").
 *
 * @param {string} message - The message to be parsed
 * @returns {{ from: ?string, to: ?string, weight: ?number, unit: ?string }}
 */
function parseMessage (message) {
  let from, to, weight, unit;

  // Parse "from XXX to YYYY"
  let match = /from ([a-z0-9 ,-]+?) to ([a-z0-9 ,-]+)/i.exec(message);
  if (match) {
    from = match[1];
    to = match[2];
  }

  // Parse "XX pounds", "X.XX ounces", "X gram", etc.
  match = /(\d+(?:\.\d+)?) ?(lb|oz|g|kg|pound|ounce|gram|kilo)/i.exec(message);
  if (match) {
    weight = parseFloat(match[1]);
    unit = match[2];
  }

  return { from, to, weight, unit };
}

/**
 * Returns the min and max rates, as currency strings (e.g. "$5.75", "$0.45", etc.)
 *
 * @param {object[]} rates - An array of rate objects from ShipEngine
 * @returns {{ minRate: string, maxRate: string }}
 */
function getRateRange (rates) {
  // Get the min & max rates
  let minRate = _.minBy(rates, "shipping_amount.amount").shipping_amount;
  let maxRate = _.maxBy(rates, "shipping_amount.amount").shipping_amount;

  // Format the rates as currency strings
  minRate = minRate.amount.toLocaleString("en", { style: "currency", currency: minRate.currency });
  maxRate = maxRate.amount.toLocaleString("en", { style: "currency", currency: maxRate.currency });

  return { minRate, maxRate };
}

module.exports = buildResponse;
