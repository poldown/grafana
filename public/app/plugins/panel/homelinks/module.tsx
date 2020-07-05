// Libraries
import React, { PureComponent, FC } from 'react';
import { css } from 'emotion';

// Utils & Services
import { PanelPlugin } from '@grafana/data';
import { stylesFactory, styleMixins, Icon, IconName } from '@grafana/ui';
import config from 'app/core/config';

// Types
import { PanelProps } from '@grafana/data';

export interface Props extends PanelProps {}

export class GrafanaLinksPanel extends PureComponent<Props> {
  render() {
    const styles = getStyles();

    return (
      <>
        <div className={styles.list}></div>
        <VersionFooter />
      </>
    );
  }
}

interface HomeLinkProps {
  title: string;
  url: string;
  target?: string;
  icon: IconName;
}

export const HomeLink: FC<HomeLinkProps> = ({ title, url, target, icon }) => {
  const styles = getStyles();

  return (
    <a className={styles.item} href={url} target={target}>
      <Icon name={icon} className={styles.icon} />
      {title}
    </a>
  );
};

export const VersionFooter: FC = () => {
  const styles = getStyles();
  const { version, commit } = config.buildInfo;

  return (
    <div className={styles.footer}>
      Version {version} ({commit})
    </div>
  );
};

export const getStyles = stylesFactory(() => {
  const { theme } = config;

  return {
    list: css`
      display: flex;
      flex-direction: column;
      padding: ${theme.spacing.md};
    `,
    icon: css`
      margin-right: ${theme.spacing.sm};
    `,
    footer: css`
      background: ${theme.colors.bg2};
      font-size: ${theme.typography.size.sm};
      position: absolute;
      bottom: 0;
      width: 100%;
      text-align: center;
      padding: ${theme.spacing.sm};
      border-radius: 0;
      box-shadow: none;
      color: ${theme.colors.textWeak};
    `,
    item: css`
      ${styleMixins.listItem(theme)}
      padding: ${theme.spacing.sm};
      display: flex;
      margin-bottom: ${theme.spacing.xs};
      align-items: center;
    `,
  };
});

export const plugin = new PanelPlugin(GrafanaLinksPanel).setNoPadding();
