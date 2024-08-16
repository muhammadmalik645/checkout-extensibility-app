import React, { useEffect, useState } from 'react';
import {
  reactExtension,
  Divider,
  Image,
  Banner,
  Heading,
  Button,
  InlineLayout,
  BlockStack,
  Text,
  SkeletonText,
  SkeletonImage,
  useCartLines,
  useApplyCartLinesChange,
  useApi,
  Link,
  Modal,
  TextBlock,
  BlockSpacer,
  Disclosure,
  View,
  BlockLayout,
  InlineStack,
  Pressable,
  useSettings,
  Badge,
  InlineSpacer,
  Icon,
} from '@shopify/ui-extensions-react/checkout';
//import { InlineStack } from '@shopify/ui-extensions/checkout';
// Set up the entry point for the extension
export default reactExtension('purchase.checkout.block.render', () => <App />);

function App() {
  const { query, i18n, ui } = useApi();
  const applyCartLinesChange = useApplyCartLinesChange();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showError, setShowError] = useState(false);
  const lines = useCartLines();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  async function handleAddToCart(variantId, discount) {
    console.log('variantId', variantId);
    console.log('discount', discount);
    setAdding(true);
    const result = await applyCartLinesChange({
      type: 'addCartLine',
      merchandiseId: variantId,
      quantity: 1,
      attributes: [
        {
          key: 'discountAdd',
          value: `${discount}`,
        },
      ],
    });
    setAdding(false);
    if (result.type === 'error') {
      setShowError(true);
      console.error(result.message);
    }
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data } = await query(
        `query ($first: Int!) {
          products(first: $first) {
            nodes {
              id
              title
              vendor
              images(first:1){
                nodes {
                  url
                }
              }
              variants(first: 50) {
                nodes {
                  id
                  title
                  price {
                    amount
                  }
                  product {
                    id
                  }
                }
              }
            }
          }
        }`,
        {
          variables: { first: 5 },
        }
      );
      setProducts(data.products.nodes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // if (loading) {
  //   return <LoadingSkeleton />;
  // }

  if (!loading && products.length === 0) {
    return null;
  }

  const productsOnOffer = getProductsOnOffer(lines, products);
  console.log('productsOnOffer', productsOnOffer);
  if (!productsOnOffer.length) {
    return null;
  }

  return (
    <ProductOffer
      products={productsOnOffer}
      i18n={i18n}
      adding={adding}
      handleAddToCart={handleAddToCart}
      showError={showError}
    />
  );
}

function LoadingSkeleton() {
  return (
    <BlockStack spacing="loose">
      <Divider />
      <Heading level={2}>You might also like</Heading>
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

function getProductsOnOffer(lines, products) {
  const cartLineProductVariantIds = lines.map((item) => item.merchandise.id);
  return products.filter((product) => {
    const isProductVariantInCart = product.variants.nodes.some(({ id }) => cartLineProductVariantIds.includes(id));
    return !isProductVariantInCart;
  });
}

function ProductOffer({ products, i18n, adding, handleAddToCart, showError }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isPressed, setIsPressed] = useState('transparent');
  const { discount_amount: discountAmount } = useSettings();
  const discount = discountAmount ?? 10;
  const [chevronState, setChevronState] = useState(false);
  const [activeState, setActiveState] = useState(null);
  // const updateVariant = (variant) => {
  //   setSelectedVariant(variant);
  // };

  return (
    <Link
      overlay={
        <Modal id="my-modal" padding title="Buy This as well">
          <BlockStack spacing="loose">
            <Divider />
            {products.map((product) => {
              const { images, title, variants, vendor } = product;
              console.log('variants', variants.nodes);
              const availableVariants = variants.nodes;
              const imageUrl =
                images.nodes[0]?.url ??
                'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_medium.png?format=webp&v=1530129081';
              return (
                <BlockStack spacing="loose">
                  <Disclosure>
                    <InlineLayout spacing="base" columns={[64, 'fill', 'auto']} blockAlignment="center">
                      <Image
                        border="base"
                        borderWidth="base"
                        borderRadius="loose"
                        source={imageUrl}
                        description={title}
                        aspectRatio={1}
                      />
                      <BlockStack spacing="none">
                        <Text size="medium" emphasis="strong">
                          {title}
                        </Text>
                        {/* <Text appearance="subdued">{renderPrice}</Text> */}
                        <BlockSpacer spacing="extraTight" />
                        <InlineLayout columns={[64]}>
                          <Badge size="small" tone="critical">
                            {discount}% off
                          </Badge>
                        </InlineLayout>
                      </BlockStack>

                      <Button
                        onPress={() => {
                          setActiveState(product.title);
                          setChevronState(!chevronState);
                        }}
                        inlineAlignment="start"
                        toggles={title}
                        kind="plain"
                      >
                        <Icon
                          source={chevronState && product.title == activeState ? 'chevronUp' : 'chevronDown'}
                        ></Icon>
                      </Button>
                    </InlineLayout>
                    <View id={title}>
                      <InlineLayout columns={['40%', 'fill']}>
                        <View border="none" padding="base">
                          <Image
                            border="none"
                            borderWidth="base"
                            borderRadius="loose"
                            source={imageUrl}
                            description={title}
                            aspectRatio={1}
                          />
                        </View>
                        <View border="none" padding="base">
                          <BlockLayout
                            rows={
                              availableVariants.length > 1
                                ? [60, 20, 'auto', 20, 80, 60, 'auto']
                                : [60, 20, 'auto', 10, 60, 'auto']
                            }
                          >
                            <View border="none" padding="base">
                              <Heading level={1}>{title}</Heading>
                              {vendor}
                            </View>
                            <BlockSpacer spacing="base" />
                            <Divider />
                            <BlockSpacer spacing="base" />

                            {availableVariants.length > 1 ? (
                              <View border="none" padding="base">
                                <InlineStack spacing="base">
                                  {availableVariants.map((variant) => {
                                    return (
                                      <Pressable
                                        border="base"
                                        cornerRadius="base"
                                        padding="base"
                                        background={selectedVariant === variant ? isPressed : 'transparent'}
                                        onPress={() => {
                                          setIsPressed('subdued');
                                          setSelectedVariant(variant);
                                        }}
                                      >
                                        {variant.title}
                                      </Pressable>
                                    );
                                  })}
                                </InlineStack>
                              </View>
                            ) : (
                              <></>
                            )}

                            <View border="none" padding="base">
                              <Text accessibilityRole="deletion">
                                {selectedVariant && product.id == selectedVariant.product.id
                                  ? i18n.formatCurrency(selectedVariant.price.amount)
                                  : i18n.formatCurrency(availableVariants[0].price.amount)}
                              </Text>
                              <InlineSpacer spacing="extraTight" />
                              <Text emphasis="bold">
                                {selectedVariant && product.id == selectedVariant.product.id
                                  ? i18n.formatCurrency(
                                      selectedVariant.price.amount - selectedVariant.price.amount * (discount / 100)
                                    )
                                  : i18n.formatCurrency(
                                      availableVariants[0].price.amount -
                                        availableVariants[0].price.amount * (discount / 100)
                                    )}
                              </Text>
                            </View>
                            <Button
                              loading={
                                (!selectedVariant && !availableVariants.length > 1 ? adding : false) ||
                                (product.id == selectedVariant?.product.id ? adding : false)
                              }
                              onPress={() =>
                                handleAddToCart(
                                  selectedVariant ? selectedVariant.id : availableVariants[0].id,
                                  discount
                                )
                              }
                            >
                              Add Product
                            </Button>
                          </BlockLayout>
                        </View>
                      </InlineLayout>
                    </View>
                  </Disclosure>
                </BlockStack>
              );
            })}

            {showError && <ErrorBanner />}
          </BlockStack>
          <BlockSpacer spacing="loose" />
          <BlockStack>
            <Button onPress={() => ui.overlay.close('my-modal')}>Close</Button>
          </BlockStack>
        </Modal>
      }
    >
      You may also Like
    </Link>
  );
}

function ErrorBanner() {
  return <Banner status="critical">There was an issue adding this product. Please try again.</Banner>;
}
