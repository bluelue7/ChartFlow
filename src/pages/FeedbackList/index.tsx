import { addFeedbackUsingPost, deleteFeedbackUsingDelete, updateFeedbackUsingPut, getFeedbackUsingGet, getFeedbackListPageUsingPost, getMyFeedbackListUsingGet } from "@/services/chart-flow/feedbackController";
import { getAllChartListUsingGet } from "@/services/chart-flow/chartController";
import { useModel } from "@@/exports";
import { Card, Input, Button, Rate, Modal, Table, message, DatePicker, Select, InputNumber } from "antd";
import React, { useEffect, useState } from "react";

const FeedbackListPage: React.FC = () => {
  const { initialState } = useModel("@@initialState");
  const { currentUser } = initialState ?? {};
  const [feedbackList, setFeedbackList] = useState<API.Feedback[]>();
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchParams, setSearchParams] = useState<API.FeedbackQueryRequest>({
    current: 1,
    pageSize: 10,
  });
  const [chartList, setChartList] = useState<API.Chart[]>();
  const [visible, setVisible] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<API.Feedback | null>(null);
  const [formData, setFormData] = useState({
    chartId: 0,
    comment: "",
    rating: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      let res;
      if (currentUser?.userRole === "admin") {
        res = await getFeedbackListPageUsingPost(searchParams);
      } else {
        res = await getMyFeedbackListUsingGet({
          page: searchParams.current,
          size: searchParams.pageSize,
        });
      }
      if (res.data) {
        setFeedbackList(res.data.records ?? res.data.content ?? []);
        setTotal(res.data.total ?? res.data.totalElements ?? 0);
      } else {
        message.error("获取反馈列表失败");
      }
    } catch (e: any) {
      message.error("获取反馈列表失败，" + e.message);
    }
    setLoading(false);
  };

  const loadCharts = async () => {
    try {
      const res = await getAllChartListUsingGet({ page: 1, size: 100 });
      if (res.data) {
        setChartList(res.data.records ?? []);
      }
    } catch (e: any) {
      console.error("获取图表列表失败", e);
    }
  };

  useEffect(() => {
    loadData();
    if (currentUser?.userRole === "admin") {
      loadCharts();
    }
  }, [searchParams]);

  const handleAdd = () => {
    setEditingFeedback(null);
    setFormData({ chartId: 0, comment: "", rating: 0 });
    setVisible(true);
  };

  const handleEdit = (feedback: API.Feedback) => {
    setEditingFeedback(feedback);
    setFormData({
      chartId: feedback.chartId || 0,
      comment: feedback.comment || "",
      rating: feedback.rating || 0,
    });
    setVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteFeedbackUsingDelete({ id });
      if (res.data) {
        message.success("删除成功");
        loadData();
      } else {
        message.error("删除失败");
      }
    } catch (e: any) {
      message.error("删除失败，" + e.message);
    }
  };

  const handleSubmit = async () => {
    try {
      let res;
      if (editingFeedback) {
        res = await updateFeedbackUsingPut({
          id: editingFeedback.id,
          comment: formData.comment,
          rating: formData.rating,
        });
      } else {
        res = await addFeedbackUsingPost(formData);
      }
      if (res.code === 0) {
        message.success(editingFeedback ? "修改成功" : "添加成功");
        setVisible(false);
        loadData();
      } else {
        message.error(res.message || (editingFeedback ? "修改失败" : "添加失败"));
      }
    } catch (e: any) {
      message.error((editingFeedback ? "修改" : "添加") + "失败，" + e.message);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "图表ID",
      dataIndex: "chartId",
      key: "chartId",
    },
    {
      title: "评分",
      dataIndex: "rating",
      key: "rating",
      render: (rating: number) => <Rate disabled defaultValue={rating} />,
    },
    {
      title: "评论",
      dataIndex: "comment",
      key: "comment",
    },
    {
      title: "用户ID",
      dataIndex: "userId",
      key: "userId",
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
    },
    {
      title: "操作",
      key: "action",
      render: (_, record: API.Feedback) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="small" onClick={() => handleEdit(record)}>修改</Button>
          <Button size="small" danger onClick={() => handleDelete(record.id || 0)}>删除</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="feedback-list-page">
      <Card title={currentUser?.userRole === "admin" ? "反馈管理" : "我的反馈"}>
        <div style={{ marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          {currentUser?.userRole === "admin" && (
            <>
              <InputNumber
                placeholder="图表ID"
                value={searchParams.chartId}
                onChange={(value) => setSearchParams(prev => ({ ...prev, chartId: value }))}
                style={{ width: 150 }}
              />
              <InputNumber
                placeholder="用户ID"
                value={searchParams.userId}
                onChange={(value) => setSearchParams(prev => ({ ...prev, userId: value }))}
                style={{ width: 150 }}
              />
              <InputNumber
                placeholder="评分"
                min={1}
                max={5}
                value={searchParams.rating}
                onChange={(value) => setSearchParams(prev => ({ ...prev, rating: value }))}
                style={{ width: 150 }}
              />
              <DatePicker
                placeholder="开始时间"
                value={searchParams.createTimeStart ? new Date(searchParams.createTimeStart) : undefined}
                onChange={(date) => setSearchParams(prev => ({ ...prev, createTimeStart: date?.toISOString() }))}
                style={{ width: 200 }}
              />
              <DatePicker
                placeholder="结束时间"
                value={searchParams.createTimeEnd ? new Date(searchParams.createTimeEnd) : undefined}
                onChange={(date) => setSearchParams(prev => ({ ...prev, createTimeEnd: date?.toISOString() }))}
                style={{ width: 200 }}
              />
            </>
          )}
          <Button onClick={() => { setSearchParams({ current: 1, pageSize: 10 }); loadData(); }}>重置</Button>
          <Button type="primary" onClick={handleAdd}>添加反馈</Button>
        </div>

        <Table
          columns={columns}
          dataSource={feedbackList}
          rowKey="id"
          loading={loading}
          pagination={{
            current: searchParams.current,
            pageSize: searchParams.pageSize,
            total: total,
            onChange: (page, pageSize) => {
              setSearchParams(prev => ({ ...prev, current: page, pageSize }));
            },
          }}
        />
      </Card>

      <Modal
        title={editingFeedback ? "修改反馈" : "添加反馈"}
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={[
          <Button key="back" onClick={() => setVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>确定</Button>
        ]}
      >
        {currentUser?.userRole === "admin" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8 }}>选择图表</label>
            <Select
              style={{ width: "100%" }}
              placeholder="请选择图表"
              value={formData.chartId || undefined}
              onChange={(value) => setFormData(prev => ({ ...prev, chartId: value }))}
            >
              {chartList?.map(chart => (
                <Select.Option key={chart.id} value={chart.id}>{chart.name}</Select.Option>
              ))}
            </Select>
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8 }}>评分</label>
          <Rate
            value={formData.rating}
            onChange={(value) => setFormData(prev => ({ ...prev, rating: value || 0 }))}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8 }}>评论</label>
          <Input.TextArea
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="请输入评论内容"
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
};
export default FeedbackListPage;
