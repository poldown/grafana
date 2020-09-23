import { DevicesState } from 'app/types';
//import { User } from 'app/core/services/context_srv';

export const getSearchQuery = (state: DevicesState) => (state ? state.searchQuery : '');
export const getDevicesCount = (state: DevicesState) => (state ? state.devices.length : 0);

export const getDevices = (state: DevicesState) => {
  if (!state) {
    return [];
  }

  const regex = RegExp(state.searchQuery, 'i');

  return state.devices.filter(device => {
    return regex.test(device.name);
  });
};
