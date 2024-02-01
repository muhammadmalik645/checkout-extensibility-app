import {
  Banner,
  useApi,
  useTranslate,
  reactExtension,
  useApplyDiscountCodeChange,
  useDiscountCodes,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension />,
);

function Extension() {
  const translate = useTranslate();
  const { extension } = useApi();
  const discountChange = useApplyDiscountCodeChange()
  const appliedDiscountCodes = useDiscountCodes()

  console.log('appliedDiscountCodes', appliedDiscountCodes)

  const discountRemover = async (codeToRemove) => {
    await discountChange({
      type: 'removeDiscountCode',
      code: codeToRemove
    })
  }

  appliedDiscountCodes.forEach((discountCode)=>{
    if(discountCode.code == 'SHIPFREE'){
      discountRemover(discountCode.code)
      return (
        <Banner title='Alert'>
          You can't add {discountCode.code} with these products
        </Banner>
      )
    }
  })
}