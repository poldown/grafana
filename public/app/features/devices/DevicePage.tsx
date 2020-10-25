import React, { PureComponent } from 'react';
import { hot } from 'react-hot-loader';
import Page from 'app/core/components/Page/Page';
import { Legend, Form, Field, Input, Button } from '@grafana/ui';
import { NavModel } from '@grafana/data';
import { StoreState, Device } from 'app/types';
import { deleteDevice, loadDevice, updateDevice } from './state/actions';
import { getNavModel } from 'app/core/selectors/navModel';
import { contextSrv, User } from 'app/core/services/context_srv';
import { connectWithCleanUp } from '../../core/components/connectWithCleanUp';
import { getRouteParamsId } from 'app/core/selectors/location';
import { getDevice } from './state/selectors';
//import { MapComponent } from './MapComponent';

export interface Props {
  navModel: NavModel;
  device: Device;
  deviceId: string;
  loadDevice: typeof loadDevice;
  deleteDevice: typeof deleteDevice;
  updateDevice: typeof updateDevice;
  signedInUser: User;
}

export class DevicePage extends PureComponent<Props, any> {
  componentDidMount() {
    this.fetchDevice();
  }

  async fetchDevice() {
    const { loadDevice } = this.props;
    this.setState({ isLoading: true });
    const device = await loadDevice(this.props.deviceId);
    this.setState({ isLoading: false });
    return device;
  }

  deleteDevice = (device: Device) => {
    this.props.deleteDevice(device.id);
  };

  updateDevice = (device: Device) => {
    this.props.updateDevice(device);
  };

  render() {
    const { navModel, device } = this.props;
    console.log(device);
    return (
      <Page navModel={navModel}>
        <Page.Contents>
          <>
            <Legend>Edit Device</Legend>

            {device && (
              <Form
                defaultValues={device as any}
                onSubmit={async (values: any) => {
                  await this.updateDevice({
                    ...device,
                    ...values,
                  });
                }}
              >
                {({ register, errors }) => (
                  <>
                    <Field label="Name" invalid={!!errors.name} error="Name is required">
                      <Input name="name" ref={register({ required: true })} />
                    </Field>
                    <Field label="Serial-Number" invalid={!!errors.serialNumber} error="Serial-Number is required">
                      <Input name="serialNumber" ref={register({ required: true })} readOnly={true} />
                    </Field>
                    <Field label="Location">
                      <Input name="locationText" ref={register({ required: false })} />
                    </Field>
                    <Field label="Location Gps - Latitude">
                      <Input name="locationGps.latitude" type="number" ref={register({ required: false })} />
                    </Field>
                    <Field label="Location Gps - Longitude">
                      <Input name="locationGps.longitude" type="number" ref={register({ required: false })} />
                    </Field>
                    <Button>Update</Button>
                  </>
                )}
              </Form>
            )}
          </>
        </Page.Contents>
      </Page>
    ); //<MapComponent latitude={device.locationGps} longitude={device.locationGps} />
  }
}

function mapStateToProps(state: StoreState) {
  const deviceId = getRouteParamsId(state.location);
  const device = getDevice(state.device, deviceId);

  return {
    navModel: getNavModel(state.navIndex, `device-${deviceId}`),
    device: device,
    deviceId: deviceId,
    signedInUser: contextSrv.user, // this makes the feature toggle mockable/controllable from tests,
  };
}

const mapDispatchToProps = {
  loadDevice,
  deleteDevice,
  updateDevice,
};

export default hot(module)(connectWithCleanUp(mapStateToProps, mapDispatchToProps, state => state.device)(DevicePage));
