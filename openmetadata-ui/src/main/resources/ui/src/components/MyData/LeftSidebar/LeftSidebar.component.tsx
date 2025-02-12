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
import { Button, Col, Menu, MenuProps, Row, Typography } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import classNames from 'classnames';
import { isEmpty, noop } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  LOGOUT_ITEM,
  SETTING_ITEM,
  SIDEBAR_NESTED_KEYS,
} from '../../../constants/LeftSidebar.constants';
import { SidebarItem } from '../../../enums/sidebar.enum';
import leftSidebarClassBase from '../../../utils/LeftSidebarClassBase';

import { EntityType } from '../../../enums/entity.enum';
import { useApplicationStore } from '../../../hooks/useApplicationStore';
import useCustomLocation from '../../../hooks/useCustomLocation/useCustomLocation';
import { useCustomizeStore } from '../../../pages/CustomizablePage/CustomizeStore';
import { getDocumentByFQN } from '../../../rest/DocStoreAPI';
import {
  filterAndArrangeTreeByKeys,
  getNestedKeysFromNavigationItems,
} from '../../../utils/CustomizaNavigation/CustomizeNavigation';
import BrandImage from '../../common/BrandImage/BrandImage';
import './left-sidebar-rtl.less';
import './left-sidebar.less';
import { LeftSidebarItem as LeftSidebarItemType } from './LeftSidebar.interface';
import LeftSidebarItem from './LeftSidebarItem.component';

const LeftSidebar = () => {
  const location = useCustomLocation();
  const { t, i18n } = useTranslation();
  const { onLogoutHandler } = useApplicationStore();
  const [showConfirmLogoutModal, setShowConfirmLogoutModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);
  const { selectedPersona } = useApplicationStore();
  const isRtl = i18n.language === 'pr-PR';

  const { currentPersonaDocStore, setCurrentPersonaDocStore } =
    useCustomizeStore();

  const navigationItems = useMemo(() => {
    return currentPersonaDocStore?.data?.navigation;
  }, [currentPersonaDocStore]);

  const sideBarItems = isEmpty(navigationItems)
    ? leftSidebarClassBase.getSidebarItems()
    : filterAndArrangeTreeByKeys(
        leftSidebarClassBase.getSidebarItems(),
        getNestedKeysFromNavigationItems(navigationItems)
      );

  const selectedKeys = useMemo(() => {
    const pathArray = location.pathname.split('/');
    const deepPath = [...pathArray].splice(0, 3).join('/');

    return SIDEBAR_NESTED_KEYS[deepPath]
      ? [deepPath]
      : [pathArray.splice(0, 2).join('/')];
  }, [location.pathname]);

  const handleLogoutClick = useCallback(() => {
    setShowConfirmLogoutModal(true);
  }, []);

  const hideConfirmationModal = () => {
    setShowConfirmLogoutModal(false);
  };

  const LOWER_SIDEBAR_TOP_SIDEBAR_MENU_ITEMS: MenuProps['items'] = useMemo(
    () =>
      [SETTING_ITEM, LOGOUT_ITEM].map((item) => ({
        key: item.key,
        label: (
          <LeftSidebarItem
            data={{
              ...item,
              onClick:
                item.key === SidebarItem.LOGOUT ? handleLogoutClick : noop,
            }}
          />
        ),
      })),
    [handleLogoutClick]
  );

  const handleMouseOver = useCallback(() => {
    if (!isSidebarCollapsed) {
      return;
    }
    setIsSidebarCollapsed(false);
  }, [isSidebarCollapsed]);

  const handleMouseOut = useCallback(() => {
    setIsSidebarCollapsed(true);
  }, []);

  const fetchCustomizedDocStore = useCallback(async (personaFqn: string) => {
    try {
      const pageLayoutFQN = `${EntityType.PERSONA}.${personaFqn}`;

      const document = await getDocumentByFQN(pageLayoutFQN);
      setCurrentPersonaDocStore(document);
    } catch (error) {
      // silent error
    }
  }, []);

  useEffect(() => {
    if (selectedPersona.fullyQualifiedName) {
      fetchCustomizedDocStore(selectedPersona.fullyQualifiedName);
    }
  }, [selectedPersona]);

  return (
    <div
      className={classNames(
        'd-flex flex-col justify-between h-full',
        { 'sidebar-open-rtl': !isSidebarCollapsed && isRtl },
        { 'sidebar-open': !isSidebarCollapsed && !isRtl },
        { 'left-sidebar-container-rtl': isRtl },
        { 'left-sidebar-container': !isRtl }
      )}
      data-testid="left-sidebar"
      onMouseLeave={handleMouseOut}
      onMouseOver={handleMouseOver}>
      <Row className="p-b-sm">
        <Col
          className={
            isRtl ? 'brand-logo-container-rtl' : 'brand-logo-container'
          }
          span={24}>
          <Link className="flex-shrink-0" id="openmetadata_logo" to="/">
            <BrandImage
              alt="OpenMetadata Logo"
              className="vertical-middle"
              dataTestId="image"
              height={30}
              isMonoGram={isSidebarCollapsed}
              width="auto"
            />
          </Link>
        </Col>

        <Col className="w-full">
          <Menu
            items={sideBarItems.map((item) => {
              return {
                key: item.key,
                label: <LeftSidebarItem data={item} />,
                children: item.children?.map((item: LeftSidebarItemType) => {
                  return {
                    key: item.key,
                    label: <LeftSidebarItem data={item} />,
                  };
                }),
              };
            })}
            mode="inline"
            rootClassName="left-sidebar-menu"
            selectedKeys={selectedKeys}
            subMenuCloseDelay={1}
          />
        </Col>
      </Row>

      <Row className="p-y-sm">
        <Menu
          items={LOWER_SIDEBAR_TOP_SIDEBAR_MENU_ITEMS}
          mode="inline"
          rootClassName="left-sidebar-menu"
          selectedKeys={selectedKeys}
        />
      </Row>
      {showConfirmLogoutModal && (
        <Modal
          centered
          bodyStyle={{ textAlign: 'center' }}
          closable={false}
          closeIcon={null}
          footer={null}
          open={showConfirmLogoutModal}
          width={360}
          onCancel={hideConfirmationModal}>
          <Typography.Title level={5}>{t('label.logout')}</Typography.Title>
          <Typography.Text className="text-grey-muted">
            {t('message.logout-confirmation')}
          </Typography.Text>

          <div className="d-flex gap-2 w-full m-t-md justify-center">
            <Button className="confirm-btn" onClick={hideConfirmationModal}>
              {t('label.cancel')}
            </Button>
            <Button
              className="confirm-btn"
              data-testid="confirm-logout"
              type="primary"
              onClick={onLogoutHandler}>
              {t('label.logout')}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeftSidebar;
