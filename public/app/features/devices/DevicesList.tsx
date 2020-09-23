import React, { PureComponent } from 'react';
import { hot } from 'react-hot-loader';
import Page from 'app/core/components/Page/Page';
import { DeleteButton, LinkButton } from '@grafana/ui';
import { NavModel } from '@grafana/data';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';
import { StoreState, Device } from 'app/types';
import { deleteDevice, loadDevices } from './state/actions';
import { getSearchQuery, getDevices, getDevicesCount } from './state/selectors';
import { getNavModel } from 'app/core/selectors/navModel';
import { contextSrv, User } from 'app/core/services/context_srv';
import { connectWithCleanUp } from '../../core/components/connectWithCleanUp';
import { setSearchQuery } from './state/reducers';

export interface Props {
  navModel: NavModel;
  devices: Device[];
  searchQuery: string;
  devicesCount: number;
  hasFetched: boolean;
  loadDevices: typeof loadDevices;
  deleteDevice: typeof deleteDevice;
  setSearchQuery: typeof setSearchQuery;
  signedInUser: User;
}

export class DevicesList extends PureComponent<Props, any> {
  componentDidMount() {
    this.fetchDevices();
  }

  async fetchDevices() {
    await this.props.loadDevices();
  }

  deleteDevice = (device: Device) => {
    this.props.deleteDevice(device.id);
  };

  onSearchQueryChange = (value: string) => {
    this.props.setSearchQuery(value);
  };

  renderDevice(device: Device) {
    const { signedInUser } = this.props;
    const deviceUrl = `org/devices/edit/${device.id}`;
    const canDelete = signedInUser.isSignedIn;

    return (
      <tr key={device.id}>
        <td className="width-4 text-center link-td">
          <a href={deviceUrl}></a>
        </td>
        <td className="link-td">
          <a href={deviceUrl}>{device.name}</a>
        </td>
        <td className="link-td">
          <a href={deviceUrl}>{device.serialNumber}</a>
        </td>
        <td className="text-right">
          <DeleteButton size="sm" disabled={!canDelete} onConfirm={() => this.deleteDevice(device)} />
        </td>
      </tr>
    );
  }

  renderEmptyList() {
    return (
      <EmptyListCTA
        title="You haven't created any devices yet."
        buttonIcon="users-alt"
        buttonLink="org/devices/new"
        buttonTitle=" New device"
      />
    );
  }

  renderDevicesList() {
    const { devices } = this.props;
    const newDeviceHref = 'org/devices/new';

    return (
      <>
        <div className="page-action-bar">
          <div className="gf-form gf-form--grow" />

          <div className="page-action-bar__spacer" />

          <LinkButton href={newDeviceHref}>New Device</LinkButton>
        </div>

        <div className="admin-list-table">
          <table className="filter-table filter-table--hover form-inline">
            <thead>
              <tr>
                <th />
                <th>Name</th>
                <th>Serial Number</th>
                <th style={{ width: '1%' }} />
              </tr>
            </thead>
            <tbody>{devices.map(device => this.renderDevice(device))}</tbody>
          </table>
        </div>
      </>
    );
  }

  renderList() {
    const { devicesCount } = this.props;

    if (devicesCount > 0) {
      return this.renderDevicesList();
    } else {
      return this.renderEmptyList();
    }
  }

  render() {
    const { hasFetched, navModel } = this.props;

    return (
      <Page navModel={navModel}>
        <Page.Contents isLoading={!hasFetched}>{hasFetched && this.renderList()}</Page.Contents>
      </Page>
    );
  }
}

function mapStateToProps(state: StoreState) {
  return {
    navModel: getNavModel(state.navIndex, 'devices'),
    devices: getDevices(state.devices),
    searchQuery: getSearchQuery(state.devices),
    devicesCount: getDevicesCount(state.devices),
    hasFetched: state.devices ? state.devices.hasFetched : false,
    signedInUser: contextSrv.user, // this makes the feature toggle mockable/controllable from tests,
  };
}

const mapDispatchToProps = {
  loadDevices,
  deleteDevice,
  setSearchQuery,
};

export default hot(module)(
  connectWithCleanUp(mapStateToProps, mapDispatchToProps, state => state.devices)(DevicesList)
);
