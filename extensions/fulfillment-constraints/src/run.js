// @ts-check

/**
* @typedef {import("../generated/api").RunInput} RunInput
* @typedef {import("../generated/api").RunInput["fulfillmentGroups"][0]} FulfillmentGroup
* @typedef {import("../generated/api").RunInput["locations"][0]} Location
* @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
* @typedef {import("../generated/api").Operation} Operation
* @typedef {import("../generated/api").FulfillmentGroupRankedLocations} FulfillmentGroupRankedLocations
* @typedef {import("../generated/api").RankedLocation} RankedLocation
*/

/**
* @param {RunInput} input
* @returns {FunctionRunResult}
*/
export function run(input) {
  // Load the fulfillment groups and generate the rank operations for each one
  let operations = input.fulfillmentGroups
    .map(fulfillmentGroup => /** @type {Operation} */(
      {
        rank: buildRankOperation(fulfillmentGroup, input.locations)
      }
    ));

  // Return the operations
  return { operations: operations };
};

/**
* @param {FulfillmentGroup} fulfillmentGroup
* @param {Location[]} locations
* @returns {FulfillmentGroupRankedLocations}
*/
function buildRankOperation(fulfillmentGroup, locations) {
  return {
    fulfillmentGroupHandle: fulfillmentGroup.handle,
    rankings: prioritizeCanadianLocations(fulfillmentGroup.inventoryLocationHandles, locations),
  };
};

/**
* @param {string[]} locationHandles
* @param {Location[]} locations
* @returns {RankedLocation[]}
*/
function prioritizeCanadianLocations(locationHandles, locations) {
  // Load the inventory locations for the fulfillment group
  return locationHandles.map(locationHandle => {
    const location = locations.find((loc) => loc.handle == locationHandle);
    return {
      locationHandle,
      // Rank the location as 0 if the country code is CA, otherwise rank it as 1
      rank: location?.address.countryCode === "CA" ? 0 : 1,
    }
  });
};
