import { genChartByAiUsingPost } from '@/services/chart-flow/chartController';
import { uploadDatasetUsingPost } from '@/services/chart-flow/datasetController';
import { getMyPromptListUsingGet } from '@/services/chart-flow/promptController';
import { UploadOutlined } from '@ant-design/icons';
import {Button, Card, Col, Divider, Form, Input, message, Row, Select, Space, Spin, Upload} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';

/**
 * 添加图表页面
 * @constructor
 */
const AddChart: React.FC = () => {
  const [chart, setChart] = useState<API.BiResponse>();
  const [option, setOption] = useState<any>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [promptList, setPromptList] = useState<API.Prompt[]>([]);

  // 加载用户的 prompt 列表
  React.useEffect(() => {
    const loadPrompts = async () => {
      try {
        const res = await getMyPromptListUsingGet({ page: 1, size: 100 });
        if (res.data) {
          setPromptList(res.data.records || []);
        }
      } catch (e) {
        console.error('加载 prompt 列表失败', e);
      }
    };
    loadPrompts();
  }, []);

  /**
   * 提交
   * @param values
   */
  const onFinish = async (values: any) => {
    // 避免重复提交
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setChart(undefined);
    setOption(undefined);
    // 对接后端，上传数据
    const params = {
      ...values,
      file: undefined,
    };
    try {
      // 先上传数据集
      const datasetRes = await uploadDatasetUsingPost(
        { name: values.file.file.name },
        {},
        values.file.file.originFileObj
      );
      if (!datasetRes?.data) {
        message.error('数据集上传失败');
        return;
      }
      
      const res = await genChartByAiUsingPost(params, {}, values.file.file.originFileObj);
      if (!res?.data) {
        message.error('分析失败');
      } else {
        message.success('分析成功');
        const chartOption = JSON.parse(res.data.genChart ?? '');
        if (!chartOption) {
          throw new Error('图表代码解析错误')
        } else {
          setChart(res.data);
          setOption(chartOption);
        }
      }
    } catch (e: any) {
      message.error('分析失败，' + e.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="add-chart">
      <Row gutter={24}>
        <Col span={12}>
          <Card title="智能分析">
            <Form name="addChart" labelAlign="left" labelCol={{ span: 4 }}
                  wrapperCol={{ span: 16 }} onFinish={onFinish} initialValues={{}}>
              <Form.Item
                name="goal"
                label="分析目标"
                rules={[{ required: true, message: '请输入分析目标' }]}
              >
                <TextArea placeholder="请输入你的分析需求，比如：分析网站用户的增长情况" />
              </Form.Item>
              <Form.Item name="name" label="图表名称">
                <Input placeholder="请输入图表名称" />
              </Form.Item>
              <Form.Item name="chartType" label="图表类型">
                <Select
                  options={[
                    { value: 'line', label: '折线图' },
                    { value: 'bar', label: '柱状图' },
                    { value: 'pie', label: '饼图' },
                    { value: 'scatter', label: '散点图' },
                    { value: 'radar', label: '雷达图' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="promptId" label="提词模板">
                <Select
                  placeholder="请选择提词模板（可选）"
                  allowClear
                >
                  {promptList.map(prompt => (
                    <Select.Option key={prompt.id} value={prompt.id}>
                      {prompt.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="file" label="原始数据">
                <Upload name="file" maxCount={1}>
                  <Button icon={<UploadOutlined />}>上传 Excel 文件</Button>
                </Upload>
              </Form.Item>

              <Form.Item wrapperCol={{ span: 16, offset: 4 }}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={submitting} disabled={submitting}>
                    提交
                  </Button>
                  <Button htmlType="reset">重置</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="分析结论">
            {chart?.genResult ?? <div>请先在左侧进行提交</div>}
            <Spin spinning={submitting}/>
          </Card>
          <Divider />
          <Card title="可视化图表">
            {
              option ? <ReactECharts option={option} /> : <div>请先在左侧进行提交</div>
            }
            <Spin spinning={submitting}/>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
export default AddChart;
