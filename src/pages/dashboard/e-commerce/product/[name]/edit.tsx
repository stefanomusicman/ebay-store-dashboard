import { useEffect, useState } from 'react';
import { paramCase } from 'change-case';
// next
import Head from 'next/head';
import { useRouter } from 'next/router';
// @mui
import { Container } from '@mui/material';
// redux
import { useDispatch, useSelector } from '../../../../../redux/store';
import { getProducts } from '../../../../../redux/slices/product';
// routes
import { PATH_DASHBOARD } from '../../../../../routes/paths';
// layouts
import DashboardLayout from '../../../../../layouts/dashboard';
// components
import { useSettingsContext } from '../../../../../components/settings';
import CustomBreadcrumbs from '../../../../../components/custom-breadcrumbs';
// sections
import ProductNewEditForm from '../../../../../sections/@dashboard/e-commerce/ProductNewEditForm';
import { Item } from 'types/item';
import { itemService } from 'src/services/firestore-services/ItemService';

// ----------------------------------------------------------------------

EcommerceProductEditPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// ----------------------------------------------------------------------

export default function EcommerceProductEditPage() {
  const { themeStretch } = useSettingsContext();

  const dispatch = useDispatch();
  const [currentProduct, setCurrentProduct] = useState<Item | null>(null);

  const {
    query: { name },
    isReady
  } = useRouter();

  useEffect(() => {
    console.log('id: ', name);
    if (!isReady || !name) return; // Ensure the router is ready and `id` is available

    const fetchProduct = async () => {
      try {
        const product = await itemService.getItemById(name as string);
        setCurrentProduct(product); // Update state with the fetched product
      } catch (error) {
        console.error('Failed to fetch product:', error);
      }
    };

    fetchProduct();
  }, [name, isReady]);

  // const currentProduct = useSelector((state) =>
  //   state.product.products.find((product) => paramCase(product.name) === name)
  // );

  // useEffect(() => {
  //   dispatch(getProducts());
  // }, [dispatch]);

  return (
    <>
      <Head>
        <title> Ecommerce: Edit product</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Edit product"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            {
              name: 'E-Commerce',
              href: PATH_DASHBOARD.eCommerce.root,
            },
            { name: currentProduct?.name },
          ]}
        />

        <ProductNewEditForm isEdit currentProduct={currentProduct as Item} />
      </Container>
    </>
  );
}
