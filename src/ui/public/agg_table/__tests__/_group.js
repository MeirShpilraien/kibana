/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import $ from 'jquery';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import fixtures from 'fixtures/fake_hierarchical_data';
import { LegacyResponseHandlerProvider } from '../../vis/response_handlers/legacy';
import FixturesStubbedLogstashIndexPatternProvider from 'fixtures/stubbed_logstash_index_pattern';
import { VisProvider } from '../../vis';
describe('AggTableGroup Directive', function () {

  let $rootScope;
  let $compile;
  let Vis;
  let indexPattern;
  let tableAggResponse;

  beforeEach(ngMock.module('kibana'));
  beforeEach(ngMock.inject(function ($injector, Private) {
    tableAggResponse = Private(LegacyResponseHandlerProvider).handler;
    indexPattern = Private(FixturesStubbedLogstashIndexPatternProvider);
    Vis = Private(VisProvider);

    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');
  }));

  let $scope;
  beforeEach(function () {
    $scope = $rootScope.$new();
  });
  afterEach(function () {
    $scope.$destroy();
  });


  it('renders a simple split response properly', async function () {
    const vis = new Vis(indexPattern, 'table');
    $scope.group = await tableAggResponse(vis, fixtures.metricOnly);
    $scope.sort = {
      columnIndex: null,
      direction: null
    };
    const $el = $('<kbn-agg-table-group group="group"></kbn-agg-table-group>');

    $compile($el)($scope);
    $scope.$digest();

    // should create one sub-tbale
    expect($el.find('kbn-agg-table').length).to.be(1);
  });

  it('renders nothing if the table list is empty', function () {
    const $el = $('<kbn-agg-table-group group="group"></kbn-agg-table-group>');

    $scope.group = {
      tables: []
    };

    $compile($el)($scope);
    $scope.$digest();

    const $subTables = $el.find('kbn-agg-table');
    expect($subTables.length).to.be(0);
  });

  it('renders a complex response properly', async function () {
    const vis = new Vis(indexPattern, {
      type: 'pie',
      aggs: [
        { type: 'avg', schema: 'metric', params: { field: 'bytes' } },
        { type: 'terms', schema: 'split', params: { field: 'extension' } },
        { type: 'terms', schema: 'segment', params: { field: 'geo.src' } },
        { type: 'terms', schema: 'segment', params: { field: 'machine.os' } }
      ]
    });
    vis.aggs.forEach(function (agg, i) {
      agg.id = 'agg_' + (i + 1);
    });

    const group = $scope.group = await tableAggResponse(vis, fixtures.threeTermBuckets);
    const $el = $('<kbn-agg-table-group group="group"></kbn-agg-table-group>');
    $compile($el)($scope);
    $scope.$digest();

    const $subTables = $el.find('kbn-agg-table');
    expect($subTables.length).to.be(3);

    const $subTableHeaders = $el.find('.agg-table-group-header');
    expect($subTableHeaders.length).to.be(3);

    $subTableHeaders.each(function (i) {
      expect($(this).text()).to.be(group.tables[i].title);
    });
  });
});
