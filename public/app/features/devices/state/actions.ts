import { getBackendSrv } from '@grafana/runtime';

import { ThunkResult } from 'app/types';
import { updateNavIndex } from 'app/core/actions';
import { buildNavModel } from './navModel';
import { devicesLoaded, deviceLoaded } from './reducers';

export function loadDevices(): ThunkResult<void> {
  return async dispatch => {
    const response = await getBackendSrv().get('/api/devices/search', { perpage: 1000, page: 1 });
    dispatch(devicesLoaded(response.devices));
  };
}

export function loadDevice(id: number): ThunkResult<void> {
  return async dispatch => {
    const response = await getBackendSrv().get(`/api/devices/${id}`);
    dispatch(deviceLoaded(response));
    dispatch(updateNavIndex(buildNavModel(response)));
  };
}

export function updateDevice(name: string, serialNumber: string): ThunkResult<void> {
  return async (dispatch, getStore) => {
    const device = getStore().device.device;
    await getBackendSrv().put(`/api/devices/${device.id}`, { name });
    dispatch(loadDevice(device.id));
  };
}

export function deleteDevice(id: number): ThunkResult<void> {
  return async dispatch => {
    await getBackendSrv().delete(`/api/devices/${id}`);
    dispatch(loadDevices());
  };
}
