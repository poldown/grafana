import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Device, DeviceState, DevicesState } from 'app/types';

export const initialDevicesState: DevicesState = { devices: [], searchQuery: '', hasFetched: false };

const devicesSlice = createSlice({
  name: 'devices',
  initialState: initialDevicesState,
  reducers: {
    devicesLoaded: (state, action: PayloadAction<Device[]>): DevicesState => {
      return { ...state, hasFetched: true, devices: action.payload };
    },
    setSearchQuery: (state, action: PayloadAction<string>): DevicesState => {
      return { ...state, searchQuery: action.payload };
    },
  },
});

export const { devicesLoaded, setSearchQuery } = devicesSlice.actions;

export const devicesReducer = devicesSlice.reducer;

export const initialDeviceState: DeviceState = {
  device: {} as Device,
  searchQuery: '',
  hasFetched: false,
};

const deviceSlice = createSlice({
  name: 'device',
  initialState: initialDeviceState,
  reducers: {
    deviceLoaded: (state, action: PayloadAction<Device>): DeviceState => {
      return { ...state, hasFetched: true, device: action.payload };
    },
    setDeviceSearchQuery: (state, action: PayloadAction<string>): DeviceState => {
      return { ...state, searchQuery: action.payload };
    },
  },
});

export const { deviceLoaded, setDeviceSearchQuery } = deviceSlice.actions;

export const deviceReducer = deviceSlice.reducer;

export default {
  devices: devicesReducer,
  device: deviceReducer,
};
