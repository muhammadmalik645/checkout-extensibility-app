import React, { useEffect, useState } from "react";
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
  Checkbox,
  useApplyAttributeChange,
} from '@shopify/ui-extensions-react/checkout';


// const checkoutBlock = reactExtension('purchase.checkout.block.render',() => <Extension/>)
// export { checkoutBlock }

export default reactExtension('purchase.checkout.cart-line-item.render-after', ()=> <Extension/>)

function Extension() {
  const { query, i18n } = useApi();
  const applyCartLinesChange = useApplyCartLinesChange();
  const [products, setProducts] = useState();
  const [loading, setLoading] = useState(false);
  const [checkbox_value, setcheckbox_value] = useState(false);

  const merch = useCartLineTarget();
  const productID = merch.merchandise.product.id
  const lineIds = useCartLines();
  const attributes = useApplyAttributeChange();
  
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
            metafield(namespace:"custom",key: "is_gift_wrap_") {
              value
              key
            }
            title
            description
          }
        }`
      );
      //addProduct(data.data.product.metafield.value)
      if(data?.data?.product?.metafield?.value){
        setProducts(data.data.product.metafield.value);
      }    
      
      

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function updateAttributes(id){
    console.log('ID of Parent Product', id)
    await applyCartLinesChange({
      type: 'updateCartLine',
      id: id,
      attributes: [{
        key: 'merger',
        value: 'true',
      }]
    });
  }

  async function handleAddToCart(variantId, e) {
    //console.log(variantId, e)
    if(e == true){
      
      setcheckbox_value(true)
      await applyCartLinesChange({
        type: 'addCartLine',
        merchandiseId: variantId,
        quantity: 1,
        
      });
      
      let lineID = lineIds.find((line)=> {
        //console.log({'LINE ID':line.merchandise.product.id})
        if(line.merchandise.product.id === productID){
          return line
        }
      })
      //console.log({'ATTRIBUTE UPDATED': lineID},{'EXISTING LINE IDS': lineIds},{'PRODUCT ID': productID})
      await updateAttributes(lineID.id)
      
    }
    else if(e == false){
      
      let lineID = lineIds.find((line)=> {
        if(line.merchandise.id === variantId){
          return line
        }
      })

       setcheckbox_value(false)
       await applyCartLinesChange({
         type: 'removeCartLine',
         id: lineID.id,
         quantity: 1,
       });
      // console.log(merch)
      // console.log('DELETING')
      
    }  
    
  }
  
  //const {title: merchantTitle, description: merchantDesc, collapsible: collapsibleStatus, status: merchantStatus} = useSettings();
  //console.log("Products******",products)
  // const status = merchantStatus ?? 'info';
  // const titleBanner = merchantTitle ?? 'Custom Banner';
  // const description = merchantDesc ?? 'This is the description';
  // const collapsible= collapsibleStatus ?? true
  let productMetafield = products ?? "empty"
  if(products){
    return(
      <Checkbox value={checkbox_value} onChange={(e) => handleAddToCart(products, e)}>
        Add Gift Wrap
      </Checkbox>
    )
  }
  else
  {return (
    <></>
  )};
}