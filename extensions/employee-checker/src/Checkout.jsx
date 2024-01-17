import React, { useEffect, useState } from "react";
import {
  Banner,
  useApi,
  useTranslate,
  reactExtension,
  useEmail,
  useCustomer,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension />,
);

function Extension() {
  const translate = useTranslate();
  const { extension,query } = useApi();
  const { id } = useCustomer();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      await fetchProducts(id);
      
    })();
  }, []);



  async function fetchProducts(id) {
    setLoading(true);
    try {
      const data = await query(
        `{
          customer(id: "${id}") {            
            tags           
          }
        }`
      );
      //console.clear()
      console.log('CUSTOMERS',data)      
      

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  } 

  return (
    <Banner title="employee-checker">
      {translate('welcome', {target: extension.target})}
    </Banner>
  );
}