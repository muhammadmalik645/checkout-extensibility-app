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
  useStorage,
  useAttributeValues,
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
  const storeCheckbox = useStorage()
  const [merger] = useAttributeValues(["_merger"])
  const merch = useCartLineTarget();
  const productID = merch.merchandise.product.id
  const isProductChild = merch.lineComponents
  const lineIds = useCartLines();

  useEffect(() => {
    (async () => {
      await fetchProducts(productID);
      
    })();
  }, []);

  useEffect(() => {
    if(isProductChild.length >= 2) setcheckbox_value(true); 
    console.log({'LineIds':lineIds},{'Products': products}, {'Merch': merch},{'merger': merger})
  }, [lineIds, products ,merch, merger]);

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
        setProducts(data.data.product);
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
        key: '_merger',
        value: `${id}`,
      }]
    });
  }

  async function handleAddToCart(variantId, e) {
    //console.log(variantId, e)
    if(e == true){
     
      let lineID = lineIds.find((line)=> {
        //console.log({'LINE ID':line.merchandise.product.id})
        if(line.merchandise.product.id === productID){
          return line
        }
      })
      
      // setcheckbox_value(true,()=>{
      //   saveCheckboxValue();
      // })
      setcheckbox_value(true)
      if(isProductChild.length < 2){
        await applyCartLinesChange({
          type: 'addCartLine',
          merchandiseId: variantId,
          quantity: 1,
          attributes: [{
            key: '_merger',
            value: `${lineID.id}`,
          }]
        });     

        //console.log({'ATTRIBUTE UPDATED': lineID},{'EXISTING LINE IDS': lineIds},{'PRODUCT ID': productID})
        await updateAttributes(lineID.id)
        console.log('lineIds HERE',lineIds)
      }
    }
    else if(e == false){
      
      let lineID = lineIds.find((line)=> {
        console.log(line.merchandise.id === variantId)
        if(line.merchandise.id === variantId){
          return line
        }
      })?.id
      console.log('child IDs ', lineIds[0].lineComponents[1].id)
      // const merchID = merch.merchandise.id
      // const merchQty = merch.quantity
      // console.log('Merch', lineID)
      //console.log('merch line child', lineID.lineComponents[0].id)

      // console.log('newLineId', newLineId)
      // setcheckbox_value(false,()=>{
      //   saveCheckboxValue();
      // })
      setcheckbox_value(false)

      

       await applyCartLinesChange({
         type: 'removeCartLine',
         id: lineIds[0].lineComponents[1].id,
         quantity: lineIds[0].quantity,
       });
      //  await applyCartLinesChange({
      //   type: 'addCartLine',
      //   id: merchID,
      //   quantity: merchQty,
      // });
      // console.log(merch)
      // console.log('DELETING')      
    }  
    
  }

  if(products){
    return(
      <Checkbox name="{products.title}" checked={checkbox_value} onChange={(e) => handleAddToCart(products.metafield.value, e)}>
        Add Gift Wrap
      </Checkbox>
    )
  }
  else
  {return (
    <></>
  )};
}