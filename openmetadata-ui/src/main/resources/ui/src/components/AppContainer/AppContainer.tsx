/* eslint-disable i18next/no-literal-string */
/*
 *  Copyright 2023 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import { Layout } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLimitStore } from '../../context/LimitsProvider/useLimitsStore';
import { LineageSettings } from '../../generated/configuration/lineageSettings';
import { SettingType } from '../../generated/settings/settings';
import { useApplicationStore } from '../../hooks/useApplicationStore';
import { getLimitConfig } from '../../rest/limitsAPI';
import { getSettingsByType } from '../../rest/settingConfigAPI';
import applicationRoutesClass from '../../utils/ApplicationRoutesClassBase';
import Appbar from '../AppBar/Appbar';
import { LimitBanner } from '../common/LimitBanner/LimitBanner';
import LeftSidebar from '../MyData/LeftSidebar/LeftSidebar.component';
import applicationsClassBase from '../Settings/Applications/AppDetails/ApplicationsClassBase';
import { useApplicationsProvider } from '../Settings/Applications/ApplicationsProvider/ApplicationsProvider';
import './app-container.less';

const AppContainer = () => {
  const { i18n } = useTranslation();
  const { Header, Sider, Content } = Layout;
  const { currentUser, setAppPreferences } = useApplicationStore();
  const { applications } = useApplicationsProvider();
  const AuthenticatedRouter = applicationRoutesClass.getRouteElements();
  const ApplicationExtras = applicationsClassBase.getApplicationExtension();
  const isRtl = i18n.language === 'pr-PR';
  const { setConfig, bannerDetails } = useLimitStore();

  const fetchAppConfigurations = useCallback(async () => {
    try {
      const [response, lineageConfig] = await Promise.all([
        getLimitConfig(),
        getSettingsByType(SettingType.LineageSettings),
      ]);

      setConfig(response);
      setAppPreferences({ lineageConfig: lineageConfig as LineageSettings });
    } catch (error) {
      // silent fail
    }
  }, []);

  const appendReserveRightSidebarClass = useCallback(() => {
    const element = document.getElementsByTagName('body');
    element[0].classList.add('reserve-right-sidebar');
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchAppConfigurations();
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (applicationsClassBase.isFloatingButtonPresent(applications)) {
      appendReserveRightSidebarClass();
    }
  }, [applications]);

  return (
    <Layout>
      <LimitBanner />
      <Layout
        className={classNames('app-container', {
          ['extra-banner']: Boolean(bannerDetails),
        })}>
        <Sider
          className={classNames(
            { 'left-sidebar-col': !isRtl },
            {
              'left-sidebar-col-rtl': isRtl,
            }
          )}
          width={60}>
          <LeftSidebar />
        </Sider>
        <Layout>
          <Header className="p-x-0">
            <Appbar />
          </Header>
          <Content>
            <AuthenticatedRouter />
            {ApplicationExtras && <ApplicationExtras />}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppContainer;
