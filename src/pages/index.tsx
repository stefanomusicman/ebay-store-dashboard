import { useEffect } from 'react';
import { useRouter } from 'next/router';
// next
import Head from 'next/head';
import LoadingScreen from 'src/components/loading-screen/LoadingScreen';
import { PATH_AUTH } from 'src/routes/paths';
// layouts
import MainLayout from '../layouts/main';

// ----------------------------------------------------------------------

HomePage.getLayout = (page: React.ReactElement) => <MainLayout> {page} </MainLayout>;

// ----------------------------------------------------------------------

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(PATH_AUTH.login);
  }, [router]);

  return (
    <>
      <Head>
        <title> Loading...</title>
      </Head>

      <LoadingScreen />
    </>
  );
}
