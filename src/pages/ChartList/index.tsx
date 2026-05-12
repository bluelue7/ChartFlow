import { getAllChartListUsingGet, getMyChartListUsingGet } from '@/services/chart-flow/chartController';
import { addFeedbackUsingPost, deleteFeedbackUsingDelete, updateFeedbackUsingPut, getFeedbackUsingGet, getFeedbackListPageUsingPost } from '@/services/chart-flow/feedbackController';

import { useModel } from '@@/exports';
import { Card, Input, Select, Tag, message, Row, Col, Modal, Pagination, Button, Rate } from 'antd';
import ReactECharts from 'echarts-for-react';
import React, { useEffect, useState } from 'react';

const ChartListPage: React.FC = () => {
  const initSearchParams = {
    current: 1,
    pageSize: 10,
    status: '',
    keyword: '',
    userId: undefined as number | undefined,
  };

  const [searchParams, setSearchParams] = useState({ ...initSearchParams });
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState ?? {};
  const [chartList, setChartList] = useState<API.Chart[]>();
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewChart, setPreviewChart] = useState<API.Chart | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  
  // 反馈相关状态
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedChart, setSelectedChart] = useState<API.Chart | null>(null);
  const [chartFeedbacks, setChartFeedbacks] = useState<Record<string, API.Feedback[]>>({});
  const [feedbackForm, setFeedbackForm] = useState({
    comment: '',
    rating: 0,
  });
  const [editingFeedback, setEditingFeedback] = useState<API.Feedback | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      let res;
      if (currentUser?.userRole === 'admin') {
        res = await getAllChartListUsingGet(searchParams);
      } else {
        const { userId, ...params } = searchParams;
        res = await getMyChartListUsingGet(params);
      }
      if (res.data) {
        setChartList(res.data.records ?? []);
        setTotal(res.data.total ?? 0);
      } else {
        message.error('获取图表列表失败');
      }
    } catch (e: any) {
      message.error('获取图表列表失败，' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  const handleSearch = () => {
    setSearchParams(prev => ({ ...prev, current: 1 }));
  };

  const handleChartClick = (chart: API.Chart) => {
    if (chart.status === 'succeed' || chart.status === 'completed') {
      setPreviewChart(chart);
      setPreviewVisible(true);
    }
  };

  const getStatusTag = (status: string) => {
    let color = 'default';
    let text = status;
    switch (status) {
      case 'wait':
      case 'pending':
        color = 'warning';
        text = '待生成';
        break;
      case 'running':
        color = 'info';
        text = '生成中';
        break;
      case 'succeed':
      case 'completed':
        color = 'success';
        text = '成功';
        break;
      case 'failed':
        color = 'error';
        text = '失败';
        break;
    }
    return <Tag color={color}>{text}</Tag>;
  };

  const renderChartPreview = (genChart: string, status: string, onClick?: () => void) => {
    if ((status === 'succeed' || status === 'completed') && genChart) {
      try {
        const chartOption = JSON.parse(genChart);
        return (
          <div 
            onClick={onClick} 
            style={{ cursor: onClick ? 'pointer' : 'default' }}
          >
            <ReactECharts option={chartOption} style={{ width: '100%', height: 200 }} />
          </div>
        );
      } catch (e) {
        return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5222d' }}>JSON解析失败</div>;
      }
    }
    return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>暂无预览</div>;
  };

  // 反馈相关方法
  const handleOpenFeedback = async (chart: API.Chart) => {
    setSelectedChart(chart);
    setEditingFeedback(null);
    setFeedbackForm({ comment: '', rating: 0 });
    const chartId = String(chart.id); 
    
    // 加载该图表的反馈列表
    try {
      // 使用后端列表查询接口，通过 chartId 过滤获取该图表的所有反馈
      const res = await getFeedbackListPageUsingPost({
        chartId: chartId,
        current: 1,
        pageSize: 10,
      });
      if (res.data) {
        setChartFeedbacks(prev => ({ 
          ...prev, 
          [chartId]: res.data.records || []
        }));
      }
    } catch (e) {
      console.error('加载反馈失败', e);
      const chartId = String(chart.id);
      setChartFeedbacks(prev => ({ ...prev, [chartId]: [] }));
    }
    
    setFeedbackModalVisible(true);
  };

  const handleCloseFeedback = () => {
    setFeedbackModalVisible(false);
    setSelectedChart(null);
    setEditingFeedback(null);
    setFeedbackForm({ comment: '', rating: 0 });
  };

  const handleSubmitFeedback = async () => {
    if (!selectedChart || !feedbackForm.rating) return;
    
    try {
      let res;
      if (editingFeedback) {
        res = await updateFeedbackUsingPut({
          id: editingFeedback.id,
          rating: feedbackForm.rating,
          comment: feedbackForm.comment,
        });
      } else {
        res = await addFeedbackUsingPost({
          chartId: String(selectedChart.id),
          rating: feedbackForm.rating,
          comment: feedbackForm.comment,
        });
      }
      
      if (res.code === 0) {
        message.success(editingFeedback ? '修改成功' : '添加成功');
        // 刷新当前图表的反馈列表
        if (selectedChart) {
          const chartId = String(selectedChart.id);
          const feedbackRes = await getFeedbackListPageUsingPost({
            chartId: chartId,
            current: 1,
            pageSize: 100,
          });
          if (feedbackRes.data) {
            setChartFeedbacks(prev => ({ 
              ...prev, 
              [chartId]: feedbackRes.data.records || []
            }));
          }
        }
        // 重置表单
        setEditingFeedback(null);
        setFeedbackForm({ comment: '', rating: 0 });
      } else {
        message.error(res.message || (editingFeedback ? '修改失败' : '添加失败'));
      }
    } catch (e: any) {
      message.error((editingFeedback ? '修改' : '添加') + '失败，' + e.message);
    }
  };

  const handleEditFeedback = (feedback: API.Feedback) => {
    setEditingFeedback(feedback);
    setFeedbackForm({
      comment: feedback.comment || '',
      rating: feedback.rating || 0,
    });
  };

  const handleDeleteFeedback = async (id: number) => {
    try {
      const res = await deleteFeedbackUsingDelete({ id });
      if (res.data) {
        message.success('删除成功');
        if (selectedChart) {
          const chartId = String(selectedChart.id);
          setChartFeedbacks(prev => ({
            ...prev,
            [chartId]: prev[chartId]?.filter(f => f.id !== id) || []
          }));
        }
      } else {
        message.error('删除失败');
      }
    } catch (e: any) {
      message.error('删除失败，' + e.message);
    }
  };

  return (
    <div className="chart-list-page">
      <Card title={currentUser?.userRole === 'admin' ? '所有图表' : '我的图表'}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="关键词搜索"
            value={searchParams.keyword}
            onChange={(e) => setSearchParams(prev => ({ ...prev, keyword: e.target.value }))}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Select
            placeholder="状态筛选"
            value={searchParams.status || undefined}
            onChange={(value) => setSearchParams(prev => ({ ...prev, status: value || '' }))}
            style={{ width: 150 }}
          >
            <Select.Option value="">全部</Select.Option>
            <Select.Option value="pending">待生成</Select.Option>
            <Select.Option value="running">生成中</Select.Option>
            <Select.Option value="completed">成功</Select.Option>
            <Select.Option value="failed">失败</Select.Option>
          </Select>
          {currentUser?.userRole === 'admin' && (
            <Input
              type="number"
              placeholder="用户ID筛选"
              value={searchParams.userId}
              onChange={(e) => setSearchParams(prev => ({ ...prev, userId: e.target.value ? Number(e.target.value) : undefined }))}
              style={{ width: 150 }}
            />
          )}
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {chartList?.map((chart) => (
          <Col span={12} key={chart.id}>
            <Card
              title={chart.name}
              extra={getStatusTag(chart.status || '')}
              loading={loading}
            >
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#666', fontSize: '12px', marginBottom: 4 }}>分析目标</div>
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{chart.goal}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#666', fontSize: '12px', marginBottom: 4 }}>图表类型</div>
                <div style={{ fontSize: '14px' }}>{chart.chartType || '-'}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px', marginBottom: 8 }}>
                  图表预览
                  {(chart.status === 'succeed' || chart.status === 'completed') && (
                    <span style={{ color: '#1890ff', marginLeft: 8, fontSize: '12px' }}>
                      (点击放大)
                    </span>
                  )}
                </div>
                {renderChartPreview(chart.genChart || '', chart.status || '', () => handleChartClick(chart))}
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                <div style={{ color: '#666', fontSize: '12px', marginBottom: 8 }}>
                  创建时间：{chart.createTime || '-'}
                </div>
                <Button 
                  type="primary" 
                  size="small" 
                  onClick={() => handleOpenFeedback(chart)}
                  style={{ marginTop: 8 }}
                >
                  查看/添加反馈
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {!loading && chartList && chartList.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无图表数据</div>
        </Card>
      )}

      {!loading && chartList && chartList.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Pagination
            current={searchParams.current}
            pageSize={searchParams.pageSize}
            total={total}
            onChange={(page, pageSize) => {
              setSearchParams(prev => ({ ...prev, current: page, pageSize }));
            }}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `共 ${total} 条`}
          />
        </div>
      )}

      <Modal
        title={previewChart?.name || '图表预览'}
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={900}
        bodyStyle={{ padding: 0 }}
      >
        {previewChart && previewChart.genChart && (
          <div style={{ padding: 20 }}>
            <ReactECharts 
              option={JSON.parse(previewChart.genChart)} 
              style={{ width: '100%', height: 500 }} 
            />
          </div>
        )}
      </Modal>

      {/* 反馈弹窗 */}
      <Modal
        title={`${selectedChart?.name || ''} - 反馈管理`}
        visible={feedbackModalVisible}
        onCancel={() => handleCloseFeedback()}
        width={700}
      >
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 12 }}>添加新反馈</h4>
          <Rate
            value={feedbackForm.rating}
            onChange={(value) => setFeedbackForm(prev => ({ ...prev, rating: value || 0 }))}
          />
          <Input.TextArea
            value={feedbackForm.comment}
            onChange={(e) => setFeedbackForm(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="请输入评论内容"
            rows={3}
            style={{ marginTop: 12 }}
          />
          <Button 
            type="primary" 
            onClick={handleSubmitFeedback} 
            style={{ marginTop: 12 }}
            disabled={!feedbackForm.rating}
          >
            {editingFeedback ? '修改反馈' : '添加反馈'}
          </Button>
        </div>

        <div>
          <h4 style={{ marginBottom: 12 }}>反馈列表</h4>
          {chartFeedbacks[String(selectedChart?.id) || '0']?.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无反馈</div>
          ) : (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {chartFeedbacks[String(selectedChart?.id) || '0']?.map(feedback => (
                <div 
                  key={feedback.id} 
                  style={{ 
                    padding: 12, 
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <div>
                    <Rate disabled defaultValue={feedback.rating} style={{ marginBottom: 8 }} />
                    <p>{feedback.comment}</p>
                    <p style={{ fontSize: '12px', color: '#999' }}>创建时间: {feedback.createTime}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button 
                      size="small" 
                      onClick={() => handleEditFeedback(feedback)}
                    >
                      修改
                    </Button>
                    <Button 
                      size="small" 
                      danger 
                      onClick={() => handleDeleteFeedback(feedback.id || 0)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
export default ChartListPage;