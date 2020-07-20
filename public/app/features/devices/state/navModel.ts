import { Device } from 'app/types';
import { NavModelItem, NavModel } from '@grafana/data';

export function buildNavModel(device: Device): NavModelItem {
  const navModel = {
    icon: 'device',
    id: 'device-' + device.id,
    subTitle: 'Manage devices',
    url: '',
    text: device.name,
    breadcrumbs: [{ title: 'Devices', url: 'org/devices' }],
    children: [
      {
        active: false,
        icon: 'sliders-v-alt',
        id: `device-settings-${device.id}`,
        text: 'Device Settings',
        url: `org/devices/edit/${device.id}/settings`,
      },
    ],
  };

  return navModel;
}

export function getDeviceLoadingNav(pageName: string): NavModel {
  const main = buildNavModel({
    id: 1,
    orgId: 1,
    name: 'Loading',
    serialNumber: '000000',
  });

  let node: NavModelItem;

  // find active page
  for (const child of main.children) {
    if (child.id.indexOf(pageName) > 0) {
      child.active = true;
      node = child;
      break;
    }
  }

  return {
    main: main,
    node: node,
  };
}
