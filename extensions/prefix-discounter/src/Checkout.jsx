import {
  reactExtension,
  useDiscountCodes,
  useCartLineTarget,
  useApi,
  useApplyCartLinesChange,
} from '@shopify/ui-extensions-react/checkout';
import React, { useEffect, useState } from 'react';

// 1. Choose an extension target
export default reactExtension('purchase.checkout.cart-line-item.render-after', () => <Extension />);

function applyDiscounter(discounts) {
  console.log('discount to be Applied', discounts);

  let applicableDiscounts = [];
  discounts.forEach((discount) => {
    if (discount.code.includes('OFF')) {
      let modifiedDiscount = { ...discount };
      // Slice the '-OFF' part from the code
      modifiedDiscount.code = discount.code.replace('-OFF', '');

      applicableDiscounts.push(modifiedDiscount);
    }
  });

  return applicableDiscounts;
}

function Extension() {
  const { query } = useApi();
  const [lineItem, setLineItem] = useState(null); // Initialize with null or empty object
  const discounts = useDiscountCodes();
  const product = useCartLineTarget();
  const applyCartLinesChange = useApplyCartLinesChange();

  console.log('discounts', discounts);
  console.log('Cart Line', product);

  // Define a fetch function to get product data
  const fetchProducts = async (id) => {
    try {
      const data = await query(`
        {
          product(id: "${id}") {
            description
            tags
          }
        }
      `);
      console.log('Cart Line tags', data.data.product);
      setLineItem(data.data.product);
    } catch (error) {
      console.error(error);
    }
  };

  const attributeUpdater = async (product, applicableDiscounts) => {
    let attributesArray = [];
    applicableDiscounts.forEach((discount) => {
      attributesArray.push({
        key: 'discountAdd',
        value: `${discount.code}`,
      });
    });

    console.log('attributesArray', attributesArray);

    const result = await applyCartLinesChange({
      type: 'updateCartLine',
      id: product.id,
      quantity: product.quantity,
      attributes: attributesArray,
    });

    if (result.type === 'error') {
      setShowError(true);
      console.error(result.message);
    }
  };

  useEffect(() => {
    // Define a function to call the async fetchProducts
    const fetchData = async () => {
      if (product && product.merchandise && product.merchandise.product) {
        await fetchProducts(product.merchandise.product.id);
      }
    };

    fetchData();
  }, []); // Re-run when product or query changes

  useEffect(() => {
    if (!lineItem) return; // Wait until lineItem is fetched

    let applyDiscount = true;
    const tags = lineItem.tags || [];

    console.log('tags', tags);
    tags.forEach((tag) => {
      if (tag === 'no-discount') {
        applyDiscount = false;
      }
    });

    if (applyDiscount) {
      console.log('discounts', discounts);
      let applicableDiscounts = applyDiscounter(discounts);
      attributeUpdater(product, applicableDiscounts);
    }
  }, [lineItem]); // Run whenever lineItem or discounts change

  return null;
}
