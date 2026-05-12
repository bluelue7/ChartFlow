import { genChartByAiAsyncUsingPost } from '@/services/chart-flow/chartController';
import { uploadDatasetUsingPost } from '@/services/chart-flow/datasetController';
import { getMyPromptListUsingGet } from '@/services/chart-flow/promptController';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Select, Space, Upload } from 'antd';
import { useForm } from 'antd/es/form/Form';
import TextArea from 'antd/es/input/TextArea';
import React, { useState } from 'react';

/**
 * 添加图表（异步）页面
 * @constructor
 */
const AddChartAsync: React.FC = () => {
  const [form] = useForm();
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
      
      const res = await genChartByAiAsyncUsingPost(params, {}, values.file.file.originFileObj);
      // const res = await genChartByAiAsyncMqUsingPost(params, {}, values.file.file.originFileObj);
      if (!res?.data) {
        message.error('分析失败');
      } else {
        message.success('分析任务提交成功，稍后请在图表列表页面查看');
        form.resetFields();
      }
    } catch (e: any) {
      message.error('分析失败，' + e.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="add-chart-async">
      <Card title="智能分析">
        <Form
          form={form}
          name="addChart"
          labelAlign="left"
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 16 }}
          onFinish={onFinish}
          initialValues={{}}
        >
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
                { value: '折线图', label: '折线图' },
                { value: '柱状图', label: '柱状图' },
                { value: '堆叠图', label: '堆叠图' },
                { value: '饼图', label: '饼图' },
                { value: '雷达图', label: '雷达图' },
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
              <Button icon={<UploadOutlined />}>上传 EXCEL 文件</Button>
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
    </div>
  );
};
export default AddChartAsync;
