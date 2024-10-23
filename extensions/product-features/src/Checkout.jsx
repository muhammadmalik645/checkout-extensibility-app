import React, { useEffect, useState } from 'react';
import {
  Banner,
  Text,
  useTranslate,
  reactExtension,
  useTarget,
  useAppMetafields,
  useCartLineTarget,
  useCartLines,
  useApplyCartLinesChange,
  useApi,
  useSettings,
} from '@shopify/ui-extensions-react/checkout';

// const checkoutBlock = reactExtension('purchase.checkout.block.render',() => <Extension/>)
// export { checkoutBlock }

export default reactExtension('purchase.checkout.cart-line-item.render-after', () => <Extension />);

function Extension() {
  const { query, i18n } = useApi();
  const applyCartLinesChange = useApplyCartLinesChange();
  const [products, setProducts] = useState();
  const [loading, setLoading] = useState(false);

  const merch = useCartLineTarget();
  const productID = merch.merchandise.product.id;

  useEffect(() => {
    (async () => {
      await fetchProducts(productID);
    })();
  }, []);

  async function fetchProducts(id) {
    setLoading(true);
    try {
      const data = await query(
        `{
          product(id: "${id}") {
            description
            tags
          }
        }`
      );
      console.log(data.data.product.metafield.value);
      setProducts(data.data.product.metafield.value);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const {
    title: merchantTitle,
    description: merchantDesc,
    collapsible: collapsibleStatus,
    status: merchantStatus,
  } = useSettings();

  const status = merchantStatus ?? 'info';
  const titleBanner = merchantTitle ?? 'Custom Banner';
  const description = merchantDesc ?? 'This is the description';
  const collapsible = collapsibleStatus ?? true;
  let productMetafield = products ?? 'empty';

  return (
    <Banner title={titleBanner} status={status} collapsible={collapsible}>
      {productMetafield}
    </Banner>
  );
}
