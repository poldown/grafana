import { DevicesState } from 'app/types';
//import { User } from 'app/core/services/context_srv';

export const getSearchQuery = (state: DevicesState) => state.searchQuery;
export const getDevicesCount = (state: DevicesState) => state.devices.length;

export const getDevices = (state: DevicesState) => {
  const regex = RegExp(state.searchQuery, 'i');

  return state.devices.filter(device => {
    return regex.test(device.name);
  });
};
