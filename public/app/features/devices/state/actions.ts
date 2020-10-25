import { getBackendSrv } from '@grafana/runtime';

import { ThunkResult, Device } from 'app/types';
import { updateNavIndex } from 'app/core/actions';
import { buildNavModel } from './navModel';
import { devicesLoaded, deviceLoaded } from './reducers';

export function loadDevices(): ThunkResult<void> {
  return async dispatch => {
    const response = await getBackendSrv().get('/api/devices/search', { perpage: 1000, page: 1 });
    dispatch(devicesLoaded(response.devices));
  };
}

export function loadDevice(id: string): ThunkResult<void> {
  return async dispatch => {
    const response = await getBackendSrv().get(`/api/devices/${id}`);
    response.id = id;
    dispatch(deviceLoaded(response));
    dispatch(updateNavIndex(buildNavModel(response)));
  };
}

export function updateDevice(device: Device): ThunkResult<void> {
  return async dispatch => {
    await getBackendSrv().put(`/api/devices/${device.id}`, device);
    dispatch(loadDevice(device.id));
  };
}

export function deleteDevice(id: string): ThunkResult<void> {
  return async dispatch => {
    await getBackendSrv().delete(`/api/devices/${id}`);
    dispatch(loadDevices());
  };
}
