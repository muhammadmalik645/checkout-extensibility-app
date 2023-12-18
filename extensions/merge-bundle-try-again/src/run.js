// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const operations = []

  console.log('Input', input.cart.lines)
  let bundledArrays = groupByMergeValue(input.cart.lines)
  bundledArrays?.forEach( bundle => {
    console.log('bundle', bundle)
    if(bundle.length > 1){
      let mergeOperation = {
        merge: {
          parentVariantId: bundle[0].merchandise.id,
          cartLines: [
            {
              cartLineId: bundle[0].id,
              quantity: bundle[0].quantity
            },
            {
              cartLineId: bundle[1].id,
              quantity: bundle[1].quantity
            }
          ]
        }
      }
      operations.push(mergeOperation)
    }
  })
  if(operations.length > 0){
    return { operations }
  }
  return NO_CHANGES;
};

function groupByMergeValue(objects) {
  const grouped = objects.reduce((accumulator, object) => {
      // Use the 'merge' property as the key for grouping
      if(object.merge == null){
        return
      }
      const key = object.merge.value;

      // If the accumulator doesn't have an array for this key yet, create it
      if (!accumulator[key]) {
        accumulator[key] = [];
      }

      // Add the current object to the appropriate group
      accumulator[key].push(object);

      return accumulator;
  }, {});
  console.log('grouped', grouped)
  // Return the values from the grouped object as an array of arrays
  if(grouped){
    return Object.values(grouped);
  }
  else return
}