import { listDatasetByPageUsingPost, listMyDatasetUsingGet } from '@/services/chart-flow/datasetController';

import { useModel } from '@@/exports';
import { Card, message, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import Search from "antd/es/input/Search";

const DatasetPage: React.FC = () => {
  const initSearchParams = {
    current: 1,
    pageSize: 10,
  };

  const [searchParams, setSearchParams] = useState<API.DatasetQueryRequest>({ ...initSearchParams });
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState ?? {};
  const [datasetList, setDatasetList] = useState<API.Dataset[]>();
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      let res;
      if (currentUser?.userRole === 'admin') {
        res = await listDatasetByPageUsingPost(searchParams);
      } else {
        res = await listMyDatasetUsingGet({ page: searchParams.current, size: searchParams.pageSize });
      }
      if (res.data) {
        setDatasetList(res.data.records ?? []);
        setTotal(res.data.total ?? 0);
      } else {
        message.error('获取数据集失败');
      }
    } catch (e: any) {
      message.error('获取数据集失败，' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  const columns = [
    {
      title: '数据集名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '行数',
      dataIndex: 'rowCount',
      key: 'rowCount',
    },
    {
      title: '列数',
      dataIndex: 'columnCount',
      key: 'columnCount',
    },
    {
      title: '路径',
      dataIndex: 'filePath',
      key: 'filePath',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
  ];

  return (
    <div className="dataset-page">
      <div>
        <Search placeholder="请输入数据集名称" enterButton loading={loading} onSearch={(value) => {
          setSearchParams({
            ...initSearchParams,
            name: value,
          })
        }}/>
      </div>
      <div className="margin-16" />
      <Card title="数据集列表">
        <Table
          columns={columns}
          dataSource={datasetList}
          rowKey="id"
          loading={loading}
          pagination={{
            onChange: (page, pageSize) => {
              setSearchParams({
                ...searchParams,
                current: page,
                pageSize,
              })
            },
            current: searchParams.current,
            pageSize: searchParams.pageSize,
            total: total,
          }}
        />
      </Card>
    </div>
  );
};
export default DatasetPage;