import React, { useEffect, useState } from 'react';
import {
  reactExtension,
  ProductThumbnail,
  Banner,
  Heading,
  InlineLayout,
  SkeletonImage,
  SkeletonText,
  Button,
  BlockStack,
  ChoiceList,
  Choice,
  useCartLines,
  useApplyCartLinesChange,
  useApi,
  useSettings,
  View,
  BlockLayout,
  Pressable,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension('purchase.checkout.block.render', () => <App />);

function App() {
  const { query, i18n, analytics } = useApi();
  const applyCartLinesChange = useApplyCartLinesChange();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showError, setShowError] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('none');
  const lines = useCartLines();
  const { heading, product_heading1, product_heading2 } = useSettings();

  useEffect(() => {
    (async () => {
      const ids = await getUpsellProducts();
      fetchProducts(ids);
    })();
  }, []);

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  async function handleUpdateCart(productId, variantId, inCart) {
    const lineItem = lines.find((line) => line.merchandise.id === variantId);

    if (inCart && !lineItem) {
      console.error('Line item not found in the cart when attempting to remove.');
      return;
    }

    const changes = inCart
      ? {
          id: lineItem.id, // For removing items
          quantity: 0, // Set quantity to 0 to remove the item
          type: 'updateCartLine',
        }
      : {
          merchandiseId: variantId, // For adding items
          quantity: 1, // Quantity to add
          type: 'addCartLine',
        };

    setUpdating(variantId);

    try {
      const result = await applyCartLinesChange(changes);

      if (result.type === 'error') {
        setShowError(true);
        console.error('Error applying cart lines change:', result.message);
      } else {
        publishRedditUpdateCart(inCart);
      }
    } catch (error) {
      setShowError(true);
      console.error('Unexpected error applying cart lines change:', error);
    } finally {
      setUpdating(false);
    }
  }

  function publishRedditUpdateCart(inCart) {
    analytics
      .publish(`reddit-${inCart ? 'remove-from' : 'add-to'}-cart`, {
        extensionName: 'upsell',
      })
      .then((result) => {
        if (result) {
          console.log(`successfully published event: reddit-${inCart ? 'remove-from' : 'add-to'}-cart`);
        } else {
          console.log(`failed to publish event: reddit-${inCart ? 'remove-from' : 'add-to'}-cart`);
        }
      })
      .catch((error) => {
        console.log(`failed to publish event: reddit-${inCart ? 'remove-from' : 'add-to'}-cart`);
        console.log('error', error);
      });
  }

  async function getUpsellProducts() {
    try {
      const { data } = await query(`
        query getUpsellProducts {
          metaobjects(type: "checkout_upsell", first: 2) {
            nodes {
              checkout_upsell_products: field(key: "giftwrap_items") {
                value
              }
            }
          }
        }
      `);

      const upsell_products = data.metaobjects.nodes[0]?.checkout_upsell_products?.value;
      return upsell_products;
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchProducts(ids) {
    setLoading(true);
    try {
      const { data } = await query(
        `{
          nodes(
            ids: ${ids}
          ) {
            ... on Product {
              id
              title
              description
              images(first: 1) {
                nodes {
                  url
                }
              }
              variants(first: 1) {
                nodes {
                  id
                  title
                  price {
                    amount
                  }
                }
              }
            }
          }
        }`
      );
      // Limit the number of products to 2
      const limitedProducts = data.nodes.slice(0, 2);
      setProducts(limitedProducts);

      // Check if any of the products' variants are in the cart
      const inCartProduct = limitedProducts.find((product) =>
        lines.some((line) => line.merchandise.id === product.variants.nodes[0].id)
      );

      if (inCartProduct) {
        setSelectedProduct(inCartProduct.variants.nodes[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSkeleton heading={heading} />;
  }

  if (!loading && products.length === 0) {
    return null;
  }

  const handleChoiceChange = async (selectedValue) => {
    setSelectedProduct(selectedValue);
    const inCartProductIds = lines.map((line) => line.merchandise.id);

    // Remove any product that is in the cart but not selected
    for (const product of products) {
      const variantId = product.variants.nodes[0].id;
      if (variantId !== selectedValue && inCartProductIds.includes(variantId)) {
        await handleUpdateCart(product.id, variantId, true);
      }
    }

    // Add the selected product to the cart if it's not "none"
    if (selectedValue !== 'none') {
      const selectedProduct = products.find((product) => product.variants.nodes[0].id === selectedValue);
      if (selectedProduct) {
        await handleUpdateCart(selectedProduct.id, selectedValue, false);
      }
    }
  };

  return (
    <ProductOffer
      products={products}
      selectedProduct={selectedProduct}
      handleChoiceChange={handleChoiceChange}
      updating={updating}
      showError={showError}
      lines={lines}
      heading={heading}
      product_heading1={product_heading1}
      product_heading2={product_heading2}
    />
  );
}

function LoadingSkeleton({ heading }) {
  return (
    <BlockStack spacing="loose" border="base">
      <Heading inlineAlignment="center" level={2}>
        {heading || 'GIFT WRAP ITEMS'}
      </Heading>
      <BlockStack spacing="loose">
        <InlineLayout spacing="base" columns={[64, 'fill', 'auto']} blockAlignment="center">
          <SkeletonImage aspectRatio={1} />
          <BlockStack spacing="none">
            <SkeletonText inlineSize="large" />
            <SkeletonText inlineSize="small" />
          </BlockStack>
          <Button kind="secondary" disabled={true}>
            Add
          </Button>
        </InlineLayout>
      </BlockStack>
    </BlockStack>
  );
}

function ProductOffer({
  products,
  selectedProduct,
  handleChoiceChange,
  showError,
  heading,
  product_heading1,
  product_heading2,
}) {
  return (
    <View>
      <BlockStack padding="base" border="base">
        <Heading inlineAlignment="left" level={2}>
          {heading || 'CHOOSE A GIFT WRAP OPTION'}
        </Heading>

        <ChoiceList
          inlineAlignment="center"
          title="Select an option"
          value={selectedProduct}
          blockAlignment="center"
          onChange={handleChoiceChange}
        >
          <Choice id="none">None</Choice>
          {products.map((product, index) => (
            <InlineLayout spacing="base" blockAlignment="center" columns={['auto', 'fill']}>
              <Choice key={product.id} id={product.variants.nodes[0].id}></Choice>
              <Pressable onPress={handleChoiceChange}>
                <InlineLayout spacing="base" blockAlignment="center" columns={['auto', 'fill']}>
                  <View>
                    <ProductThumbnail source={product.images.nodes[0]?.url} border="none" />
                  </View>

                  <View>{index === 0 ? product_heading1 || product.title : product_heading2 || product.title}</View>
                </InlineLayout>
              </Pressable>
            </InlineLayout>
          ))}
        </ChoiceList>

        {showError && <ErrorBanner />}
      </BlockStack>
    </View>
  );
}

function ErrorBanner() {
  return <Banner status="critical">There was an issue updating the cart. Please try again.</Banner>;
}
