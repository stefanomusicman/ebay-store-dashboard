import * as Yup from 'yup';
import { useCallback, useEffect, useMemo } from 'react';
// next
import { useRouter } from 'next/router';
// form
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import { LoadingButton } from '@mui/lab';
import { Box, Card, Grid, Stack, Typography, InputAdornment } from '@mui/material';
// routes
import { PATH_DASHBOARD } from '../../../routes/paths';
// @types
import { IProduct } from '../../../@types/product';
// components
import { CustomFile } from '../../../components/upload';
import { useSnackbar } from '../../../components/snackbar';
import FormProvider, {
  RHFSwitch,
  RHFSelect,
  RHFEditor,
  RHFUpload,
  RHFTextField,
  RHFRadioGroup,
  RHFAutocomplete,
} from '../../../components/hook-form';
import { Item } from 'types/item';
import { Category } from 'types/category';
import { Status } from 'types/status';
import { Platform } from 'types/platforms';
import { itemService } from 'src/services/firestore-services/ItemService';

// ----------------------------------------------------------------------

const STATUS_OPTION = [
  { label: 'Sold', value: Status.SOLD },
  { label: 'Listed', value: Status.LISTED },
  { label: 'Not Listed', value: Status.NOT_LISTED },
];

const CATEGORY_OPTION = [
  Category.BOARD_GAME,
  Category.BOOK
];

const TAGS_OPTION = [
  Platform.EBAY,
  Platform.FB_MARKETPLACE,
  Platform.KIJIJI
];

// ----------------------------------------------------------------------

interface FormValuesProps extends Omit<Item, 'picture'> {
  images: (CustomFile | string)[]; // Assuming `picture` is replaced with `images` for file handling
}

type Props = {
  isEdit?: boolean;
  currentProduct?: Item;
};

export default function ProductNewEditForm({ isEdit, currentProduct }: Props) {
  const { push } = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const NewProductSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    images: Yup.array().min(1, 'Images is required'),
    status: Yup.string().required('Status is required'),
    tags: Yup.array().min(2, 'Must have at least 2 tags'),
    cost: Yup.number().moreThan(0, 'Price should not be $0.00'),
    // description: Yup.string().required('Description is required'),
  });

  const defaultValues = useMemo(
    () => ({
      itemId: currentProduct?.itemId || '',
      name: currentProduct?.name || '',
      cost: currentProduct?.cost || 0,
      images: currentProduct?.picture ? [currentProduct.picture] : [], // Map `picture` to `images`
      salePrice: currentProduct?.salePrice || 0,
      category: currentProduct?.category || Category.BOARD_GAME,
      condition: currentProduct?.condition || 1,
      description: currentProduct?.description || '',
      status: currentProduct?.status || STATUS_OPTION[2].value,
      isComplete: currentProduct?.isComplete || true,
      listedPlatforms: currentProduct?.listedPlatforms || [],
      platformOfSale: currentProduct?.platformOfSale ?? null,
    }),
    [currentProduct]
  );


  const methods = useForm<FormValuesProps>({
    resolver: yupResolver(NewProductSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (isEdit && currentProduct) {
      reset(defaultValues);
    }
    if (!isEdit) {
      reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, currentProduct]);

  const onSubmit = async (data: FormValuesProps) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newItem: Omit<Item, 'id' | 'createdAt'> = {
        name: data.name,
        cost: data.cost,
        picture: "",
        salePrice: data.salePrice,
        category: data.category,
        condition: data.condition,
        description: data.description,
        status: data.status,
        isComplete: data.isComplete,
        listedPlatforms: data.listedPlatforms,
        platformOfSale: data.platformOfSale
      };

      const updatedItem: Item = {
        name: data.name,
        cost: data.cost,
        picture: currentProduct?.picture!,
        salePrice: data.salePrice,
        category: data.category,
        condition: data.condition,
        description: data.description,
        status: data.status,
        createdAt: currentProduct?.createdAt!,
        isComplete: data.isComplete,
        listedPlatforms: data.listedPlatforms,
        platformOfSale: data.platformOfSale
      };
      !isEdit ? await itemService.createItem(newItem, data.images[0] as File) :
        await itemService.updateEntireItem(currentProduct?.itemId!, updatedItem)
      enqueueSnackbar(!isEdit ? 'Create success!' : 'Update success!');
      reset();
      push(PATH_DASHBOARD.eCommerce.list);
      console.log('DATA', data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const files = values.images || [];

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('images', [...files, ...newFiles], { shouldValidate: true });
    },
    [setValue, values.images]
  );

  const handleRemoveFile = (inputFile: File | string) => {
    const filtered = values.images && values.images?.filter((file) => file !== inputFile);
    setValue('images', filtered);
  };

  const handleRemoveAllFiles = () => {
    setValue('images', []);
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <RHFTextField name="name" label="Product Name" />

              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  Description
                </Typography>

                <RHFEditor simple name="description" />
              </Stack>

              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  Images
                </Typography>

                {!isEdit ?
                  <RHFUpload
                    multiple
                    thumbnail
                    name="images"
                    maxSize={3145728}
                    onDrop={handleDrop}
                    onRemove={handleRemoveFile}
                    onRemoveAll={handleRemoveAllFiles}
                    onUpload={() => console.log('ON UPLOAD')}
                  /> : <img src={currentProduct?.picture} width='100%' height='auto' />}
              </Stack>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card sx={{ p: 3 }}>
              <RHFSwitch name="isComplete" label="Is Complete" />

              <Stack spacing={3} mt={2}>
                {/* <RHFTextField name="code" label="Product Code" /> */}

                {/* <RHFTextField name="sku" label="Product SKU" /> */}

                <Stack spacing={1}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Status
                  </Typography>

                  <RHFRadioGroup row spacing={4} name="status" options={STATUS_OPTION} />
                </Stack>

                <RHFSelect native name="condition" label="Condition">
                  <option value="" />
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
                    <option key={number} value={number}>
                      {number}
                    </option>
                  ))}
                </RHFSelect>

                <RHFSelect native name="category" label="Category">
                  <option value="" />
                  {CATEGORY_OPTION.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </RHFSelect>

                <RHFAutocomplete
                  name="listedPlatforms"
                  label="Listed Platforms"
                  multiple
                  freeSolo
                  options={TAGS_OPTION.map((option) => option)}
                  ChipProps={{ size: 'small' }}
                />

                <RHFSelect native name="platformOfSale" label="Platform of Sale">
                  <option value="" />
                  {TAGS_OPTION.map((platform, index) => (
                    <option key={index} value={platform}>
                      {platform}
                    </option>
                  ))}
                </RHFSelect>
              </Stack>
            </Card>

            <Card sx={{ p: 3 }}>
              <Stack spacing={3} mb={2}>
                <RHFTextField
                  name="cost"
                  label="Cost Price"
                  placeholder="0.00"
                  onChange={(event) =>
                    setValue('cost', Number(event.target.value), { shouldValidate: true })
                  }
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box component="span" sx={{ color: 'text.disabled' }}>
                          $
                        </Box>
                      </InputAdornment>
                    ),
                    type: 'number',
                  }}
                />

                <RHFTextField
                  name="salePrice"
                  label="Sale Price"
                  placeholder="0.00"
                  onChange={(event) => setValue('salePrice', Number(event.target.value))}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box component="span" sx={{ color: 'text.disabled' }}>
                          $
                        </Box>
                      </InputAdornment>
                    ),
                    type: 'number',
                  }}
                />
              </Stack>

              {/* <RHFSwitch name="taxes" label="Price includes taxes" /> */}
            </Card>

            <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
              {!isEdit ? 'Create Product' : 'Save Changes'}
            </LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </FormProvider>
  );
}
