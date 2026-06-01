import { useModel } from '@@/exports';
import { Card, Input, Select, Table, Tag, message, Row, Col, Tabs } from 'antd';
import ReactECharts from 'echarts-for-react';
import React, { useEffect, useState, useMemo } from 'react';
import { request } from 'umi';

const { TabPane } = Tabs;

const LogPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState ?? {};

  const [activeTab, setActiveTab] = useState('task');
  
  const [taskLogParams, setTaskLogParams] = useState({
    chartId: '',
    current: 1,
    pageSize: 10,
    status: '',
  });
  const [taskLogList, setTaskLogList] = useState<API.TaskLog[]>();
  const [taskLogTotal, setTaskLogTotal] = useState<number>(0);
  const [taskLogLoading, setTaskLogLoading] = useState<boolean>(true);

  const [modelRecordParams, setModelRecordParams] = useState({
    chartId: undefined as number | undefined,
    current: 1,
    pageSize: 10,
    modelName: '',
    status: '',
  });
  const [modelRecordList, setModelRecordList] = useState<API.ModelRecord[]>();
  const [modelRecordTotal, setModelRecordTotal] = useState<number>(0);
  const [modelRecordLoading, setModelRecordLoading] = useState<boolean>(true);

  const loadTaskLogs = async () => {
    setTaskLogLoading(true);
    try {
      const res = await request<{ code: number; data: { records: API.TaskLog[]; total: number } }>('/api/taskLog/list/page', {
        method: 'POST',
        data: taskLogParams,
      });
      if (res.code === 0 && res.data) {
        setTaskLogList(res.data.records);
        setTaskLogTotal(res.data.total);
      } else {
        message.error('获取任务日志失败');
      }
    } catch (e: any) {
      message.error('获取任务日志失败，' + e.message);
    }
    setTaskLogLoading(false);
  };

  const loadModelRecords = async () => {
    setModelRecordLoading(true);
    try {
      const res = await request<{ code: number; data: { records: API.ModelRecord[]; total: number } }>('/api/modelRecord/list/page', {
        method: 'POST',
        data: modelRecordParams,
      });
      if (res.code === 0 && res.data) {
        setModelRecordList(res.data.records);
        setModelRecordTotal(res.data.total);
      } else {
        message.error('获取模型调用记录失败');
      }
    } catch (e: any) {
      message.error('获取模型调用记录失败，' + e.message);
    }
    setModelRecordLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'task') {
      loadTaskLogs();
    } else {
      loadModelRecords();
    }
  }, [activeTab, taskLogParams, modelRecordParams]);

  const getStatusTag = (status: string) => {
    let color = 'default';
    let text = status;
    switch (status) {
      case 'success':
      case 'succeed':
        color = 'success';
        text = '成功';
        break;
      case 'failed':
        color = 'error';
        text = '失败';
        break;
      case 'partial':
        color = 'error';
        text = '部分成功';
        break;
      case 'running':
        color = 'info';
        text = '运行中';
        break;
      case 'pending':
        color = 'warning';
        text = '待执行';
        break;
    }
    return <Tag color={color}>{text}</Tag>;
  };

  const taskLogColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '图表ID', dataIndex: 'chartId', key: 'chartId' },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    { title: '耗时(ms)', dataIndex: 'costMs', key: 'costMs' },
    { title: '执行信息', dataIndex: 'execMessage', key: 'execMessage', ellipsis: true },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  ];

  const modelRecordColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '图表ID', dataIndex: 'chartId', key: 'chartId' },
    { title: '模型名称', dataIndex: 'modelName', key: 'modelName' },
    { title: '调用类型', dataIndex: 'invocationType', key: 'invocationType' },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    { title: '输入Token', dataIndex: 'inputTokens', key: 'inputTokens' },
    { title: '输出Token', dataIndex: 'outputTokens', key: 'outputTokens' },
    { title: '总Token', dataIndex: 'totalTokens', key: 'totalTokens' },
    { title: '耗时(ms)', dataIndex: 'costMs', key: 'costMs' },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  ];

  const taskLogChartOption = useMemo(() => {
    const statusCount: { [key: string]: number } = {};
    taskLogList?.forEach(log => {
      const status = log.status === 'success' || log.status === 'succeed' ? '成功' : 
                     log.status === 'failed' ? '失败' : 
                     log.status === 'partial' ? '部分成功' : 
                     log.status === 'running' ? '运行中' : '待执行';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: Object.keys(statusCount) },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}: {c} ({d}%)' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: Object.entries(statusCount).map(([name, value]) => ({ value, name }))
      }]
    };
  }, [taskLogList]);

  const modelRecordChartOption = useMemo(() => {
    const modelCount: { [key: string]: number } = {};
    modelRecordList?.forEach(record => {
      modelCount[record.modelName] = (modelCount[record.modelName] || 0) + 1;
    });

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: Object.keys(modelCount), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: Object.values(modelCount),
        itemStyle: { borderRadius: [4, 4, 0, 0] }
      }]
    };
  }, [modelRecordList]);

  const tokenStatsChartOption = useMemo(() => {
    const totalInput = modelRecordList?.reduce((sum, r) => sum + (r.inputTokens || 0), 0) || 0;
    const totalOutput = modelRecordList?.reduce((sum, r) => sum + (r.outputTokens || 0), 0) || 0;

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['输入Token', '输出Token'] },
      series: [{
        type: 'pie',
        radius: '55%',
        center: ['50%', '50%'],
        label: { show: true, formatter: '{b}: {c} ({d}%)' },
        data: [
          { value: totalInput, name: '输入Token' },
          { value: totalOutput, name: '输出Token' },
        ]
      }]
    };
  }, [modelRecordList]);

  if (currentUser?.userRole !== 'admin') {
    return (
      <Card>
        <div style={{ textAlign: 'center', color: '#999', padding: 100 }}>
          您没有权限访问此页面
        </div>
      </Card>
    );
  }

  return (
    <div className="log-page">
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="任务日志" key="task">
          <Card title="任务日志统计" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <ReactECharts option={taskLogChartOption} style={{ height: 250 }} />
              </Col>
              <Col span={12}>
                <div style={{ padding: 20 }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: '#666', fontSize: '12px' }}>总任务数</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{taskLogTotal}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', fontSize: '12px' }}>成功任务</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                      {taskLogList?.filter(l => l.status === 'success' || l.status === 'succeed').length || 0}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          <Card title="任务日志列表">
            <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Input
                placeholder="图表ID"
                value={taskLogParams.chartId}
                onChange={(e) => setTaskLogParams(prev => ({ ...prev, chartId: e.target.value, current: 1 }))}
                style={{ width: 150 }}
              />
              <Select
                placeholder="状态筛选"
                value={taskLogParams.status || undefined}
                onChange={(value) => setTaskLogParams(prev => ({ ...prev, status: value || '', current: 1 }))}
                style={{ width: 150 }}
              >
                <Select.Option value="">全部</Select.Option>
                <Select.Option value="success">成功</Select.Option>
                <Select.Option value="failed">失败</Select.Option>
                <Select.Option value="running">运行中</Select.Option>
                <Select.Option value="partial">部分成功</Select.Option>
                <Select.Option value="pending">待执行</Select.Option>
              </Select>
            </div>
            <Table
              columns={taskLogColumns}
              dataSource={taskLogList}
              rowKey="id"
              loading={taskLogLoading}
              pagination={{
                current: taskLogParams.current,
                pageSize: taskLogParams.pageSize,
                total: taskLogTotal,
                onChange: (page, pageSize) => setTaskLogParams(prev => ({ ...prev, current: page, pageSize })),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="模型调用记录" key="model">
          <Card title="模型调用统计" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <ReactECharts option={modelRecordChartOption} style={{ height: 250 }} />
              </Col>
              <Col span={12}>
                <ReactECharts option={tokenStatsChartOption} style={{ height: 250 }} />
              </Col>
            </Row>
          </Card>

          <Card title="模型调用记录列表">
            <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Input
                type="number"
                placeholder="图表ID"
                value={modelRecordParams.chartId}
                onChange={(e) => setModelRecordParams(prev => ({ ...prev, chartId: e.target.value ? Number(e.target.value) : undefined, current: 1 }))}
                style={{ width: 150 }}
              />
              <Input
                placeholder="模型名称"
                value={modelRecordParams.modelName}
                onChange={(e) => setModelRecordParams(prev => ({ ...prev, modelName: e.target.value, current: 1 }))}
                style={{ width: 150 }}
              />
              <Select
                placeholder="状态筛选"
                value={modelRecordParams.status || undefined}
                onChange={(value) => setModelRecordParams(prev => ({ ...prev, status: value || '', current: 1 }))}
                style={{ width: 150 }}
              >
                <Select.Option value="">全部</Select.Option>
                <Select.Option value="success">成功</Select.Option>
                <Select.Option value="failed">失败</Select.Option>
              </Select>
            </div>
            <Table
              columns={modelRecordColumns}
              dataSource={modelRecordList}
              rowKey="id"
              loading={modelRecordLoading}
              pagination={{
                current: modelRecordParams.current,
                pageSize: modelRecordParams.pageSize,
                total: modelRecordTotal,
                onChange: (page, pageSize) => setModelRecordParams(prev => ({ ...prev, current: page, pageSize })),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};
export default LogPage;