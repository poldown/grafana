export interface Device {
  id: number;
  name: string;
  orgId: number;
  serialNumber: string;
}

export interface DevicesState {
  devices: Device[];
  searchQuery: string;
  hasFetched: boolean;
}

export interface DeviceState {
  device: Device;
}
