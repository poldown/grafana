export interface Device {
  id: string;
  name: string;
  orgId: number;
  serialNumber: string;
  locationGps: {
    latitude: number;
    longitude: number;
  };
  locationText: string;
}

export interface DevicesState {
  devices: Device[];
  searchQuery: string;
  hasFetched: boolean;
}

export interface DeviceState {
  device: Device;
}
