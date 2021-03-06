import React, { PureComponent } from 'react';
import Page from 'app/core/components/Page/Page';
import { hot } from 'react-hot-loader';
import { Button, LegacyForms } from '@grafana/ui';
const { FormField } = LegacyForms;
import { NavModel } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { connect } from 'react-redux';
import { getNavModel } from 'app/core/selectors/navModel';
import { StoreState } from 'app/types';

export interface Props {
  navModel: NavModel;
}

interface State {
  name: string;
  email: string;
}

export class CreateDevice extends PureComponent<Props, State> {
  state: State = {
    name: '',
    email: '',
  };

  create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { name, email } = this.state;

    const result = await getBackendSrv().post('/api/devices', { name, email });
    if (result.deviceId) {
    }
  };

  onEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      email: event.target.value,
    });
  };

  onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      name: event.target.value,
    });
  };

  render() {
    const { navModel } = this.props;
    const { name, email } = this.state;

    return (
      <Page navModel={navModel}>
        <Page.Contents>
          <>
            <h3 className="page-sub-heading">New Device</h3>

            <form className="gf-form-group" onSubmit={this.create}>
              <FormField
                className="gf-form"
                label="Name"
                value={name}
                onChange={this.onNameChange}
                inputWidth={30}
                labelWidth={10}
                required
              />
              <FormField
                type="email"
                className="gf-form"
                label="Email"
                value={email}
                onChange={this.onEmailChange}
                inputWidth={30}
                labelWidth={10}
                placeholder="email@test.com"
                tooltip="This is optional and is primarily used for allowing custom team avatars."
              />
              <div className="gf-form-button-row">
                <Button type="submit" variant="primary">
                  Create
                </Button>
              </div>
            </form>
          </>
        </Page.Contents>
      </Page>
    );
  }
}

function mapStateToProps(state: StoreState) {
  return {
    navModel: getNavModel(state.navIndex, 'devices'),
  };
}

export default hot(module)(connect(mapStateToProps)(CreateDevice));
