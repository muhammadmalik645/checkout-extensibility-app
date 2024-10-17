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
  let operations = []
  let lineItems = input.cart.lines;
  let discountProducts = lineItems.filter(line => line.discount !== null);

  discountProducts.forEach(discountProduct => {
    let discountPrice = discountProduct.cost.totalAmount.amount - (discountProduct.cost.totalAmount.amount * (discountProduct.discount.value / 100)).toFixed(3)
    let updateOperation = {
      update: {
        Id: discountProduct.id,
        price: {
          adjustment: {
            fixedPricePerUnit: {
              amount: discountPrice.toFixed(2)
            }
          }
        }

      }
    }
    operations.push(updateOperation)
  })
  if (operations.length > 0) {
    console.log('SUCCESS')
    console.log('operations', operations)
    return { operations }
  }
  return NO_CHANGES;
};