'use client';

import {alertsMockedData} from '@/app/api/alerts/data';
import {documentsMockedData} from '@/app/api/document/data';
import {createMockedInstallationListItem} from '@/app/api/installation/data';
import {PageHeader} from '@/components/PageHeader';
import {ROUTES} from '@/constants/routes';
import {inverters} from '@/mocks/inverters';
import {DeviceType, InverterType} from '@/models/device';
import {
  ConnectionStatus,
  InstallationDetailsModel,
} from '@/models/installation';
import {InverterTypeOptions} from '@/modules/installations/pages/InstallationFormPage/InstallationFormPage.const';
import {
  installationsApi,
  useCreateInstallationMutation,
  useGetEnergyStorageModelsQuery,
  useGetEnergyStorageProducersQuery,
  useGetInstallersQuery,
  useGetInverterModelsQuery,
  useGetInverterProducersQuery,
  useLazyGetInstallationQuery,
  useUpdateInstallationMutation,
} from '@/modules/installations/services/api';
import {InstallationRequestBody} from '@/modules/installations/services/api.types';
import {useAppDispatch} from '@/modules/main/store/store.hooks';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  FormControl,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  DesktopDateTimePicker,
  pickersDayClasses,
  pickersLayoutClasses,
} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFnsV3';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {enUS} from 'date-fns/locale';
import {useFormik} from 'formik';
import {useRouter} from 'next/navigation';
import {useEffect, useMemo} from 'react';
import styles from './styles.module.scss';
import {initialValues, validationSchema} from './utils';

export function InstallationFormPage({
  installationId,
}: {
  installationId?: string;
}) {
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const newInstallationId = Math.random().toString(36);

  const isEditMode = useMemo(() => Boolean(installationId), [installationId]);

  const [getInstallationRequest, {isLoading, data}] =
    useLazyGetInstallationQuery();
  const {data: inverterProducers, isLoading: isInverterProducersLoading} =
    useGetInverterProducersQuery();
  const {data: inverterModels, isLoading: isInverterModelsLoading} =
    useGetInverterModelsQuery();
  const {data: installers, isLoading: isInstallersLoading} =
    useGetInstallersQuery();
  const {data: energyStorageModels, isLoading: isEnergyStorageModelsLoading} =
    useGetEnergyStorageModelsQuery();
  const {
    data: energyStorageProducers,
    isLoading: isEnergyStorageProducersLoading,
  } = useGetEnergyStorageProducersQuery();

  useEffect(() => {
    if (!installationId) return;
    getInstallationRequest(installationId, true);
  }, [getInstallationRequest, installationId]);

  const [updateInstallation, updateInstallationState] =
    useUpdateInstallationMutation();

  const [createInstallation, createInstallationState] =
    useCreateInstallationMutation();

  const formikInitialValues = useMemo(() => {
    if (isEditMode) {
      return {
        id: data?.id ?? '',
        status: data?.status ?? '',
        name: data?.customer.name ?? '',
        phoneNumber: data?.customer.phoneNumber ?? '',
        email: data?.customer.email ?? '',
        street: data?.address.street ?? '',
        streetNumber: data?.address.streetNumber ?? '',
        zipCode: data?.address.postalCode ?? '',
        city: data?.address.city ?? '',
        installationName: data?.installationName ?? '',
        inverterManufacturerId: data?.devices.inverter.manufacturerId ?? '',
        inverterModelId: data?.devices.inverter.modelId ?? '',
        inverterPower: data?.devices.inverter.power.inverter ?? '',
        inverterType: data?.devices.inverter.inverterType ?? '',
        panelsPower: data?.devices.inverter.power.panel ?? '',
        measuringDeviceId: data?.devices.meter.meterId ?? '',
        meterNumber: data?.devices.meter.meterNumber ?? '',
        submeterId: data?.devices.meter.subMeterId ?? '',

        storageProducerId: data?.devices.storage.manufacturerId ?? '',
        storageModelId: data?.devices.storage.modelId ?? '',
        storagePower: data?.devices.storage.power ?? '',
        storageId: data?.devices.storage.storageId ?? '',

        date: new Date(data?.contract.date ?? ''),
        installerId: data?.contract.installerId ?? '',
      };
    }
    return initialValues;
  }, [data, isEditMode]);

  const handleEditMode = async () => {
    if (updateInstallationState.isLoading || !installationId) return;
    const values = formik.values;
    // TODO create prepare function for api
    await updateInstallation(values as unknown as InstallationRequestBody).then(
      () => {
        dispatch(
          installationsApi.util.updateQueryData(
            'getInstallations',
            undefined,
            installationDetailsDraft => {
              const index = installationDetailsDraft.findIndex(
                el => el.id === installationId,
              );
              if (index === -1) return;
              installationDetailsDraft[index].customerName = values.name;
              installationDetailsDraft[index].installationName =
                values.installationName;
              installationDetailsDraft[index].address.streetNumber =
                values.streetNumber;
              installationDetailsDraft[index].address.street = values.street;
              installationDetailsDraft[index].address.postalCode =
                values.zipCode;
              installationDetailsDraft[index].address.city = values.city;
              installationDetailsDraft[index].devices.inverter.manufacturer =
                inverterProducers?.find(
                  el => el.value === values.inverterManufacturerId,
                )?.label ?? '';
              installationDetailsDraft[index].devices.inverter.model =
                inverterModels?.find(el => el.value === values.inverterModelId)
                  ?.label ?? '';
              installationDetailsDraft[index].devices.inverter.power.inverter =
                Number(values.inverterPower);
              installationDetailsDraft[index].devices.inverter.inverterType =
                values.inverterType as InverterType;
              installationDetailsDraft[index].devices.inverter.power.panel =
                Number(values.panelsPower);
              installationDetailsDraft[index].devices.meter.meterId =
                values.measuringDeviceId;
              installationDetailsDraft[index].devices.meter.meterNumber =
                Number(values.meterNumber);
              installationDetailsDraft[index].devices.meter.subMeterId =
                values.submeterId;
              installationDetailsDraft[index].devices.storage.manufacturerId =
                values.storageProducerId;
              installationDetailsDraft[index].devices.storage.manufacturer =
                energyStorageProducers?.find(
                  el => el.value === values.storageProducerId,
                )?.label ?? '';
              installationDetailsDraft[index].devices.storage.model =
                values.storageModelId;
              installationDetailsDraft[index].devices.storage.model =
                energyStorageModels?.find(
                  el => el.value === values.storageModelId,
                )?.label ?? '';
              installationDetailsDraft[index].devices.storage.power = Number(
                values.storagePower,
              );
              installationDetailsDraft[index].devices.storage.storageId =
                values.storageId;
            },
          ),
        );

        dispatch(
          installationsApi.util.updateQueryData(
            'getInstallation',
            installationId,
            installationDetailsDraft => {
              installationDetailsDraft.installationName =
                values.installationName;
              installationDetailsDraft.customer.name = values.name;
              installationDetailsDraft.customer.phoneNumber =
                values.phoneNumber;
              installationDetailsDraft.customer.email = values.email;
              installationDetailsDraft.address.streetNumber =
                values.streetNumber;
              installationDetailsDraft.address.street = values.street;
              installationDetailsDraft.address.postalCode = values.zipCode;
              installationDetailsDraft.address.city = values.city;
              installationDetailsDraft.devices.inverter.manufacturerId =
                values.inverterManufacturerId;
              installationDetailsDraft.devices.inverter.manufacturer =
                inverterProducers?.find(
                  el => el.value === values.inverterManufacturerId,
                )?.label ?? '';
              installationDetailsDraft.devices.inverter.modelId =
                values.inverterModelId;
              installationDetailsDraft.devices.inverter.model =
                inverterModels?.find(el => el.value === values.inverterModelId)
                  ?.label ?? '';
              installationDetailsDraft.devices.inverter.power.inverter = Number(
                values.inverterPower,
              );
              installationDetailsDraft.devices.inverter.inverterType =
                values.inverterType as InverterType;
              installationDetailsDraft.devices.inverter.power.panel = Number(
                values.panelsPower,
              );
              installationDetailsDraft.devices.meter.meterId =
                values.measuringDeviceId;
              installationDetailsDraft.devices.meter.meterNumber = Number(
                values.meterNumber,
              );
              installationDetailsDraft.devices.meter.subMeterId =
                values.submeterId;

              installationDetailsDraft.devices.storage.manufacturerId =
                values.storageProducerId;
              installationDetailsDraft.devices.storage.manufacturer =
                energyStorageProducers?.find(
                  el => el.value === values.storageProducerId,
                )?.label ?? '';
              installationDetailsDraft.devices.storage.modelId =
                values.storageModelId;
              installationDetailsDraft.devices.storage.model =
                energyStorageModels?.find(
                  el => el.value === values.storageModelId,
                )?.label ?? '';
              installationDetailsDraft.devices.storage.power = Number(
                values.storagePower,
              );
              installationDetailsDraft.devices.storage.storageId =
                values.storageId;
              installationDetailsDraft.contract.date = new Date(values.date);
              installationDetailsDraft.contract.installerId =
                values.installerId;
              installationDetailsDraft.contract.installer =
                installers?.find(el => el.value === values.installerId)
                  ?.label ?? '';
            },
          ),
        );
        router.push(ROUTES.installationDetails(installationId));
      },
    );
  };

  const handleAddMode = async () => {
    if (createInstallationState.isLoading) return;
    const values = formik.values;
    try {
      const inverterProducer =
        inverterProducers?.find(
          el => el.value === values.inverterManufacturerId,
        )?.label ?? '';
      const inverterModel =
        energyStorageModels?.find(el => el.value === values.inverterModelId)
          ?.label ?? '';
      const energyStorageProducer =
        energyStorageProducers?.find(
          el => el.value === values.storageProducerId,
        )?.label ?? '';
      const energyStorageModel =
        energyStorageModels?.find(el => el.value === values.storageModelId)
          ?.label ?? '';

      const newInstallation: InstallationDetailsModel = {
        customer: {
          id: Math.random().toString(36),
          name: values.name,
          phoneNumber: values.phoneNumber,
          email: values.email,
          region: 'Radomskie',
          country: 'Polska',
          addressStreet: values.streetNumber,
          addressCity: values.city,
          addressPostalCode: values.zipCode,
          contractsNumber: 31,
        },
        address: {
          street: values.street,
          streetNumber: values.streetNumber,
          postalCode: values.zipCode,
          city: values.city,
        },
        devices: {
          inverter: {
            connectionStatus: ConnectionStatus.ACTIVE,
            manufacturerId: values.inverterManufacturerId,
            manufacturer: inverterProducer,
            model: inverterModel,
            modelId: values.inverterModelId,
            power: {
              inverter: Number(values.inverterPower),
              panel: Number(values.panelsPower),
            },
            inverterType: values.inverterType as InverterType,
            modbus: '',
            deviceType: 'INVERTER',
            id: values.inverterModelId,
            displayName: `${inverterProducer} ${inverterModel}`,
          },
          meter: {
            id: '834asdfg-0TL3 BH-UP',
            deviceType: 'METER',
            displayName: 'Eastron',
            model: 'Eastron',
            han: '88736549471037',
            connectionStatus: ConnectionStatus.INACTIVE,
            meterType: 'Single-phase',
            meterId: values.measuringDeviceId,
            meterNumber: Number(values.meterNumber),
            subMeterId: values.submeterId,
            power: 100,
          },
          din: {
            id: '834asdfg-0TL3 BH-UP',
            deviceType: DeviceType.DIN,
            displayName: 'DIN device',
            model: 'DIN Device',
            connectionStatus: ConnectionStatus.ACTIVE,
          },
          pv: {
            id: '834asdfg-0TL3 BH-UP',
            deviceType: DeviceType.PV,
            displayName: 'Solara,  1564462',
            model: '1564462',
            power: 30,
            connectionStatus: null,
          },
          storage: {
            id: '834asdfg-0TL3 BH-UP',
            deviceType: DeviceType.ENERGY_STORAGE,
            displayName: `${energyStorageProducer} ${energyStorageModel}`,
            modelId: values.inverterModelId,
            model: energyStorageModel,
            manufacturerId: values.inverterManufacturerId,
            manufacturer: energyStorageProducer,
            capacity: 30,
            power: Number(values.storagePower),
            storageId: values.storageId,
            connectionStatus: ConnectionStatus.ACTIVE,
          },
        },
        alerts: alertsMockedData,
        datasheets: [],
        documents: documentsMockedData,
        contract: {
          date: new Date(),
          installer:
            installers?.find(el => el.value === values.installerId)?.label ??
            '',
          installerId: values.installerId,
          installerPhone: '+48 540 124 964',
        },
        status: 'PLANNED',
        connectionStatus: ConnectionStatus.ACTIVE,
        connectionDescription: null,
        installationName: values.installationName,
        id: newInstallationId,
        energyProfile: null,
        images: [],
      };

      await createInstallation(
        createMockedInstallationListItem(newInstallation),
      ).then(() => {
        dispatch(
          installationsApi.util.updateQueryData(
            'getInstallations',
            undefined,
            installationDetailsDraft => {
              installationDetailsDraft.push(
                createMockedInstallationListItem(newInstallation),
              );
            },
          ),
        );
        dispatch(
          installationsApi.util.upsertQueryData(
            'getInstallation',
            newInstallation.id,
            newInstallation,
          ),
        );
      });

      router.push(ROUTES.installationDetails(newInstallation.id));
    } catch (error) {
      // TODO: handle api error
      console.error('Failed to create installation:', error);
    }
  };

  const formik = useFormik({
    initialValues: formikInitialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: () => {
      if (isEditMode) {
        handleEditMode();
      } else {
        handleAddMode();
      }
    },
  });

  const onInverterManufacturerChange = (event: SelectChangeEvent) => {
    formik.setFieldValue('inverterManufacturerId', event.target.value, true);
    formik.setFieldValue('inverterModelId', '', true);
    formik.setFieldValue('inverterType', '', true);
  };

  const onInverterModelChange = (event: SelectChangeEvent) => {
    formik.setFieldValue('inverterModelId', event.target.value, true);

    const inverterType = inverters.find(
      inverter => inverter.model === event.target.value,
    )?.type;

    formik.setFieldValue('inverterType', inverterType, true);
  };

  const selectMenu = (
    menuValues: Array<{label: string; value: string}>,
    formikValue: string,
  ) =>
    menuValues.map(({label, value}) => (
      <MenuItem key={value} value={value}>
        <Checkbox checked={formikValue === value} />
        <ListItemText primary={label} />
      </MenuItem>
    ));

  const inverterModelSelectMenu = useMemo(() => {
    if (!inverterModels) return [];
    return inverterModels
      .filter(
        inverter => inverter.producer === formik.values.inverterManufacturerId,
      )
      ?.map(inverter => (
        <MenuItem key={inverter.value} value={inverter.value}>
          <Checkbox
            checked={formik.values.inverterModelId === inverter.value}
          />
          <ListItemText primary={inverter.label} />
        </MenuItem>
      ));
  }, [
    inverterModels,
    formik.values.inverterManufacturerId,
    formik.values.inverterModelId,
  ]);

  // TODO: add loading
  if (isEditMode && isLoading) return 'Loading...';
  if (
    isInverterProducersLoading ||
    isInverterModelsLoading ||
    isInstallersLoading ||
    isEnergyStorageModelsLoading ||
    isEnergyStorageProducersLoading
  )
    return 'Loading...';
  if (
    !inverterProducers ||
    !inverterModels ||
    !installers ||
    !energyStorageModels ||
    !energyStorageProducers
  )
    return <>Page error</>;

  return (
    <>
      <PageHeader
        title={installationId ? 'Edit installation' : 'Add Installation'}
        description={
          installationId
            ? ''
            : 'Complete the fields and send the device installation order'
        }
        onClick={() => router.back()}
      />
      <form onSubmit={formik.handleSubmit}>
        <Paper
          variant="outlined"
          sx={{
            width: '100%',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              {!isEditMode && (
                <Typography variant="h3" mr="16px">
                  Step 1
                </Typography>
              )}

              <Typography variant="h4">
                {isEditMode
                  ? 'Edit customer details'
                  : 'Fill in the customer details'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box className={styles.inputRow}>
                <TextField
                  id="name"
                  name="name"
                  label="Name"
                  variant="outlined"
                  color="customPrimary"
                  className={styles.input}
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />

                <TextField
                  id="phoneNumber"
                  name="phoneNumber"
                  label="Phone number"
                  variant="outlined"
                  color="customPrimary"
                  className={styles.input}
                  value={formik.values.phoneNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.phoneNumber &&
                    Boolean(formik.errors.phoneNumber)
                  }
                  helperText={
                    formik.touched.phoneNumber && formik.errors.phoneNumber
                  }
                />

                <TextField
                  id="email"
                  name="email"
                  label="Email"
                  color="customPrimary"
                  className={styles.input}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Box>
              <Box className={styles.inputRow} sx={{marginTop: '24px'}}>
                <TextField
                  id="street"
                  name="street"
                  label="Street"
                  color="customPrimary"
                  className={styles.input}
                  value={formik.values.street}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.street && Boolean(formik.errors.street)}
                  helperText={formik.touched.street && formik.errors.street}
                />

                <Box className={styles.inputRow}>
                  <TextField
                    id="streetNumber"
                    name="streetNumber"
                    label="Number"
                    color="customPrimary"
                    className={styles.input}
                    value={formik.values.streetNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.streetNumber &&
                      Boolean(formik.errors.streetNumber)
                    }
                    helperText={
                      formik.touched.streetNumber && formik.errors.streetNumber
                    }
                  />

                  <TextField
                    id="zipCode"
                    name="zipCode"
                    label="Zip code"
                    color="customPrimary"
                    className={styles.input}
                    value={formik.values.zipCode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.zipCode && Boolean(formik.errors.zipCode)
                    }
                    helperText={formik.touched.zipCode && formik.errors.zipCode}
                  />
                </Box>

                <TextField
                  id="city"
                  name="city"
                  label="City"
                  color="customPrimary"
                  className={styles.input}
                  value={formik.values.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.city && Boolean(formik.errors.city)}
                  helperText={formik.touched.city && formik.errors.city}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              {!isEditMode && (
                <Typography variant="h3" mr="16px">
                  Step 2
                </Typography>
              )}

              <Typography variant="h4">
                {isEditMode ? 'Edit inverter' : 'Add an inverter'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box className={styles.inputRow}>
                <FormControl
                  className={styles.input}
                  error={
                    formik.touched.inverterManufacturerId &&
                    Boolean(formik.errors.inverterManufacturerId)
                  }>
                  <InputLabel color="customPrimary">Producer</InputLabel>
                  <Select
                    name="inverterManufacturerId"
                    label="Producer"
                    color="customPrimary"
                    value={formik.values.inverterManufacturerId}
                    onChange={onInverterManufacturerChange}
                    renderValue={() =>
                      inverterProducers.find(
                        ({value}) =>
                          value === formik.values.inverterManufacturerId,
                      )?.label ?? ''
                    }>
                    {selectMenu(
                      inverterProducers,
                      formik.values.inverterManufacturerId,
                    )}
                  </Select>
                </FormControl>

                <FormControl
                  variant="outlined"
                  className={styles.input}
                  error={
                    formik.touched.inverterModelId &&
                    Boolean(formik.errors.inverterModelId)
                  }
                  disabled={!formik.values.inverterManufacturerId}>
                  <InputLabel color="customPrimary">Model</InputLabel>
                  <Select
                    name="inverterModelId"
                    label="Model"
                    color="customPrimary"
                    value={formik.values.inverterModelId}
                    onChange={onInverterModelChange}
                    renderValue={() =>
                      inverterModels.find(
                        el => el.value === formik.values.inverterModelId,
                      )?.label ?? ''
                    }>
                    {inverterModelSelectMenu}
                  </Select>
                </FormControl>

                <TextField
                  name="inverterPower"
                  label="Inverter power"
                  color="customPrimary"
                  className={styles.input}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">kW</InputAdornment>
                    ),
                  }}
                  value={formik.values.inverterPower}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.inverterPower &&
                    Boolean(formik.errors.inverterPower)
                  }
                  helperText={
                    formik.touched.inverterPower && formik.errors.inverterPower
                  }
                />
              </Box>
              <Box className={styles.inputRow} sx={{marginTop: '24px'}}>
                <FormControl
                  variant="outlined"
                  className={styles.input}
                  error={
                    formik.touched.inverterType &&
                    Boolean(formik.errors.inverterType)
                  }>
                  <InputLabel color="customPrimary">Type</InputLabel>
                  <Select
                    name="inverterType"
                    label="Type"
                    color="customPrimary"
                    value={formik.values.inverterType}
                    onChange={formik.handleChange}
                    renderValue={selected => selected}>
                    {selectMenu(
                      InverterTypeOptions,
                      formik.values.inverterType,
                    )}
                  </Select>
                </FormControl>

                <TextField
                  name="panelsPower"
                  label="The power of panels"
                  color="customPrimary"
                  className={styles.input}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">kW</InputAdornment>
                    ),
                  }}
                  value={formik.values.panelsPower}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.panelsPower &&
                    Boolean(formik.errors.panelsPower)
                  }
                  helperText={
                    formik.touched.panelsPower && formik.errors.panelsPower
                  }
                />
                <Box className={styles.input} />
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              {!isEditMode && (
                <Typography variant="h3" mr="16px">
                  Step 3
                </Typography>
              )}

              <Typography variant="h4">
                {isEditMode
                  ? 'Edit measuring devices'
                  : 'Add measuring devices'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box className={styles.inputRow}>
                <TextField
                  name="measuringDeviceId"
                  label="ID of the measuring device"
                  variant="outlined"
                  color="customPrimary"
                  className={styles.input}
                  value={formik.values.measuringDeviceId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.measuringDeviceId &&
                    Boolean(formik.errors.measuringDeviceId)
                  }
                  helperText={
                    formik.touched.measuringDeviceId &&
                    formik.errors.measuringDeviceId
                  }
                />

                <TextField
                  name="meterNumber"
                  label="Meter number"
                  variant="outlined"
                  color="customPrimary"
                  className={styles.input}
                  value={formik.values.meterNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.meterNumber &&
                    Boolean(formik.errors.meterNumber)
                  }
                  helperText={
                    formik.touched.meterNumber && formik.errors.meterNumber
                  }
                />

                <TextField
                  name="submeterId"
                  label="Submeter ID (optional)"
                  color="customPrimary"
                  className={styles.input}
                  value={formik.values.submeterId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.submeterId &&
                    Boolean(formik.errors.submeterId)
                  }
                  helperText={
                    formik.touched.submeterId && formik.errors.submeterId
                  }
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {formik.values.inverterType !== InverterType.HYBRID && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                {!isEditMode && (
                  <Typography variant="h3" mr="16px">
                    Step 4
                  </Typography>
                )}

                <Typography variant="h4">
                  {isEditMode
                    ? 'Edit energy storage'
                    : 'Add energy storage' + ''}
                </Typography>

                {!isEditMode && (
                  <Typography variant="h4" color={theme.palette.text.secondary}>
                    &nbsp; (optional)
                  </Typography>
                )}
              </AccordionSummary>
              <AccordionDetails>
                <Box className={styles.inputRow}>
                  <FormControl
                    className={styles.input}
                    error={
                      formik.touched.storageProducerId &&
                      Boolean(formik.errors.storageProducerId)
                    }>
                    <InputLabel
                      color="customPrimary"
                      className={styles.selectLabel}>
                      Producer (optional)
                    </InputLabel>
                    <Select
                      name="storageProducerId"
                      label="Producer"
                      color="customPrimary"
                      value={formik.values.storageProducerId}
                      onChange={formik.handleChange}
                      renderValue={selected =>
                        energyStorageProducers.find(el => el.value === selected)
                          ?.label ?? ''
                      }>
                      {selectMenu(
                        energyStorageProducers,
                        formik.values.storageProducerId,
                      )}
                    </Select>
                  </FormControl>

                  <FormControl
                    variant="outlined"
                    className={styles.input}
                    error={
                      formik.touched.storageModelId &&
                      Boolean(formik.errors.storageModelId)
                    }>
                    <InputLabel
                      color="customPrimary"
                      className={styles.selectLabel}>
                      Model (optional)
                    </InputLabel>
                    <Select
                      name="storageModelId"
                      label="Model"
                      color="customPrimary"
                      value={formik.values.storageModelId}
                      onChange={formik.handleChange}
                      renderValue={selected =>
                        energyStorageModels.find(el => el.value === selected)
                          ?.label ?? ''
                      }>
                      {selectMenu(
                        energyStorageModels.filter(
                          el => el.producer === formik.values.storageProducerId,
                        ),
                        formik.values.storageModelId,
                      )}
                    </Select>
                  </FormControl>

                  <TextField
                    name="storagePower"
                    label="Power (optional)"
                    color="customPrimary"
                    className={styles.input}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">kW</InputAdornment>
                      ),
                    }}
                    value={formik.values.storagePower}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.storagePower &&
                      Boolean(formik.errors.storagePower)
                    }
                    helperText={
                      formik.touched.storagePower && formik.errors.storagePower
                    }
                  />
                </Box>
                <Box className={styles.inputRow} sx={{marginTop: '24px'}}>
                  <TextField
                    name="storageId"
                    label="Device Id (optional)"
                    color="customPrimary"
                    className={styles.input}
                    value={formik.values.storageId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.storageId &&
                      Boolean(formik.errors.storageId)
                    }
                    helperText={
                      formik.touched.storageId && formik.errors.storageId
                    }
                  />
                  <Box className={styles.input} />
                  <Box className={styles.input} />
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              {!isEditMode && (
                <Typography variant="h3" mr="16px">
                  Step{' '}
                  {formik.values.inverterType === InverterType.HYBRID ? 5 : 4}
                </Typography>
              )}

              <Typography variant="h4">
                {isEditMode ? 'Edit order' : 'Plan your order'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box className={styles.inputRow}>
                <TextField
                  name="installationName"
                  label="Installation Name"
                  color="customPrimary"
                  className={styles.input}
                  value={formik.values.installationName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.installationName &&
                    Boolean(formik.errors.installationName)
                  }
                  helperText={
                    formik.touched.installationName &&
                    formik.errors.installationName
                  }
                />

                <LocalizationProvider
                  dateAdapter={AdapterDateFns}
                  adapterLocale={enUS}>
                  <DesktopDateTimePicker
                    name="date"
                    onChange={value =>
                      formik.setFieldValue('date', value, true)
                    }
                    value={formik.values.date}
                    className={styles.input}
                    slotProps={{
                      layout: {
                        sx: {
                          [`.${pickersLayoutClasses.contentWrapper}`]: {
                            border:
                              '1px solid var(--divider, rgba(0, 0, 0, 0.12))',
                            borderRadius: '6px',
                          },
                          [`.${pickersLayoutClasses.actionBar}`]: {
                            border:
                              '1px solid var(--divider, rgba(0, 0, 0, 0.12))',
                            borderRadius: '6px',
                          },
                          [`.${pickersDayClasses.selected}`]: {
                            backgroundColor: theme.palette.primary.dark,
                          },
                        },
                      },
                    }}
                  />
                </LocalizationProvider>

                <FormControl
                  sx={{flex: 2}}
                  error={
                    formik.touched.installerId &&
                    Boolean(formik.errors.installerId)
                  }>
                  <InputLabel color="customPrimary">Installer</InputLabel>
                  <Select
                    name="installerId"
                    label="Installer"
                    color="customPrimary"
                    value={formik.values.installerId}
                    onChange={formik.handleChange}
                    renderValue={() =>
                      installers.find(
                        el => el.value === formik.values.installerId,
                      )?.label ?? ''
                    }>
                    {selectMenu(installers, formik.values.installerId)}
                  </Select>
                </FormControl>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Paper>
        <Box className={styles.buttonWrapper}>
          <Button
            variant="outlined"
            size="large"
            className={styles.button}
            onClick={() => router.back()}>
            Cancel
          </Button>

          <Button
            variant="contained"
            color="primary"
            size="large"
            className={styles.button}
            disabled={
              !formik.isValid || (!formik.touched.name && !installationId)
            }
            type="submit">
            {isEditMode ? 'Save' : 'Send'}
          </Button>
        </Box>
      </form>
    </>
  );
}