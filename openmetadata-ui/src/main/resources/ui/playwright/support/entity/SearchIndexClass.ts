/*
 *  Copyright 2024 Collate.
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
import { APIRequestContext, Page } from '@playwright/test';
import { Operation } from 'fast-json-patch';
import { SERVICE_TYPE } from '../../constant/service';
import { ServiceTypes } from '../../constant/settings';
import { uuid } from '../../utils/common';
import { visitEntityPage } from '../../utils/entity';
import {
  EntityTypeEndpoint,
  ResponseDataType,
  ResponseDataWithServiceType,
} from './Entity.interface';
import { EntityClass } from './EntityClass';

export class SearchIndexClass extends EntityClass {
  service = {
    name: `pw-search-service-${uuid()}`,
    serviceType: 'ElasticSearch',
    connection: {
      config: {
        type: 'ElasticSearch',
        hostPort: 'elasticsearch:9200',
        authType: {
          username: 'admin',
          password: 'admin',
        },
        connectionTimeoutSecs: 30,
        supportsMetadataExtraction: true,
      },
    },
  };
  private searchIndexName = `pw-search-index-${uuid()}`;
  private fqn = `${this.service.name}.${this.searchIndexName}`;

  children = [
    {
      name: 'name',
      dataType: 'TEXT',
      dataTypeDisplay: 'text',
      description: 'Table Entity Name.',
      fullyQualifiedName: `${this.fqn}.name`,
      tags: [],
    },
    {
      name: 'databaseSchema',
      dataType: 'TEXT',
      dataTypeDisplay: 'text',
      description: 'Table Entity Database Schema.',
      fullyQualifiedName: `${this.fqn}.databaseSchema`,
      tags: [],
    },
    {
      name: 'description',
      dataType: 'TEXT',
      dataTypeDisplay: 'text',
      description: 'Table Entity Description.',
      fullyQualifiedName: `${this.fqn}.description`,
      tags: [],
    },
    {
      name: 'columns',
      dataType: 'NESTED',
      dataTypeDisplay: 'nested',
      description: 'Table Columns.',
      fullyQualifiedName: `${this.fqn}.columns`,
      tags: [],
      children: [
        {
          name: 'name',
          dataType: 'TEXT',
          dataTypeDisplay: 'text',
          description: 'Column Name.',
          fullyQualifiedName: `${this.fqn}.columns.name`,
          tags: [],
        },
        {
          name: 'description',
          dataType: 'TEXT',
          dataTypeDisplay: 'text',
          description: 'Column Description.',
          fullyQualifiedName: `${this.fqn}.columns.description`,
          tags: [],
        },
      ],
    },
  ];

  entity = {
    name: this.searchIndexName,
    displayName: this.searchIndexName,
    service: this.service.name,
    fields: this.children,
  };

  serviceResponseData: ResponseDataType = {} as ResponseDataType;
  entityResponseData: ResponseDataWithServiceType =
    {} as ResponseDataWithServiceType;

  constructor(name?: string) {
    super(EntityTypeEndpoint.SearchIndex);
    this.service.name = name ?? this.service.name;
    this.type = 'SearchIndex';
    this.childrenTabId = 'fields';
    this.childrenSelectorId = this.children[0].fullyQualifiedName;
    this.serviceCategory = SERVICE_TYPE.Search;
    this.serviceType = ServiceTypes.SEARCH_SERVICES;
  }

  async create(apiContext: APIRequestContext) {
    const serviceResponse = await apiContext.post(
      '/api/v1/services/searchServices',
      {
        data: this.service,
      }
    );
    const entityResponse = await apiContext.post('/api/v1/searchIndexes', {
      data: this.entity,
    });

    this.serviceResponseData = await serviceResponse.json();
    this.entityResponseData = await entityResponse.json();

    return {
      service: serviceResponse.body,
      entity: entityResponse.body,
    };
  }

  async patch({
    apiContext,
    patchData,
  }: {
    apiContext: APIRequestContext;
    patchData: Operation[];
  }) {
    const response = await apiContext.patch(
      `/api/v1/searchIndexes/name/${this.entityResponseData?.['fullyQualifiedName']}`,
      {
        data: patchData,
        headers: {
          'Content-Type': 'application/json-patch+json',
        },
      }
    );

    this.entityResponseData = await response.json();

    return {
      entity: this.entityResponseData,
    };
  }

  async get() {
    return {
      service: this.serviceResponseData,
      entity: this.entityResponseData,
    };
  }

  async visitEntityPage(page: Page) {
    await visitEntityPage({
      page,
      searchTerm: this.entityResponseData?.['fullyQualifiedName'],
      dataTestId: `${this.service.name}-${this.entity.name}`,
    });
  }

  async delete(apiContext: APIRequestContext) {
    const serviceResponse = await apiContext.delete(
      `/api/v1/services/searchServices/name/${encodeURIComponent(
        this.serviceResponseData?.['fullyQualifiedName']
      )}?recursive=true&hardDelete=true`
    );

    return {
      service: serviceResponse.body,
      entity: this.entityResponseData,
    };
  }
}
