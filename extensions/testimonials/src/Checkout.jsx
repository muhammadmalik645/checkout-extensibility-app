import { Banner, useApi, useTranslate, reactExtension, Grid, View, Image } from '@shopify/ui-extensions-react/checkout';

export default reactExtension('purchase.checkout.block.render', () => <Extension />);

function Extension() {
  const translate = useTranslate();
  const { extension } = useApi();

  return (
    <Grid columns={['10%', 'fill']} spacing="loose">
      <View>
        <Image
          cornerRadius={'fullyRounded'}
          source="https://cdn.shopify.com/s/files/1/0818/6390/1469/files/pexels-ficky-1243617-2364605.jpg?v=1714766569"
        />
      </View>
    </Grid>
  );
}
