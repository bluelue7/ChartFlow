import { addPromptUsingPost, deletePromptUsingDelete, updatePromptUsingPut, getMyPromptListUsingGet, getPromptListPageUsingPost } from "@/services/chart-flow/promptController";
import { useModel } from "@@/exports";
import { Card, Input, Button, Modal, Table, message, Space } from "antd";
import React, { useEffect, useState } from "react";

const PromptListPage: React.FC = () => {
  const { initialState } = useModel("@@initialState");
  const { currentUser } = initialState ?? {};
  const [promptList, setPromptList] = useState<API.Prompt[]>();
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchParams, setSearchParams] = useState({
    current: 1,
    pageSize: 10,
    name: "",
  });
  const [visible, setVisible] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<API.Prompt | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    promptQuery: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      let res;
      if (currentUser?.userRole === "admin") {
        res = await getPromptListPageUsingPost(searchParams);
      } else {
        res = await getMyPromptListUsingGet({
          page: searchParams.current,
          size: searchParams.pageSize,
        });
      }
      if (res.data) {
        setPromptList(res.data.records ?? []);
        setTotal(res.data.total ?? 0);
      }
    } catch (e: any) {
      message.error("获取提词列表失败，" + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  const handleAdd = () => {
    setEditingPrompt(null);
    setFormData({ name: "", promptQuery: "" });
    setVisible(true);
  };

  const handleEdit = (prompt: API.Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name || "",
      promptQuery: prompt.promptQuery || "",
    });
    setVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deletePromptUsingDelete({ id });
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
    if (!formData.name || !formData.promptQuery) {
      message.error("请填写完整信息");
      return;
    }
    try {
      let res;
      if (editingPrompt) {
        res = await updatePromptUsingPut({
          id: editingPrompt.id,
          name: formData.name,
          promptQuery: formData.promptQuery,
        });
      } else {
        res = await addPromptUsingPost(formData);
      }
      if (res.code === 0) {
        message.success(editingPrompt ? "修改成功" : "添加成功");
        setVisible(false);
        loadData();
      } else {
        message.error(res.message || (editingPrompt ? "修改失败" : "添加失败"));
      }
    } catch (e: any) {
      message.error((editingPrompt ? "修改" : "添加") + "失败，" + e.message);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "提词内容",
      dataIndex: "promptQuery",
      key: "promptQuery",
      width: '40%',
      render: (text: string) => (
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '120px', overflowY: 'auto' }}>
          {text}
        </div>
      ),
    },
    {
      title: "使用次数",
      dataIndex: "usageCount",
      key: "usageCount",
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
    },
    {
      title: "操作",
      key: "action",
      render: (_, record: API.Prompt) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>修改</Button>
          <Button size="small" danger onClick={() => handleDelete(record.id || 0)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="prompt-list-page">
      <Card title={currentUser?.userRole === "admin" ? "提词管理" : "我的提词"}>
        <div style={{ marginBottom: 16, display: "flex", gap: 16, alignItems: "center" }}>
          <Input
            placeholder="搜索名称"
            value={searchParams.name}
            onChange={(e) => setSearchParams(prev => ({ ...prev, name: e.target.value, current: 1 }))}
            style={{ width: 200 }}
          />
          <Button onClick={() => { setSearchParams({ current: 1, pageSize: 10, name: "" }); loadData(); }}>重置</Button>
          <Button type="primary" onClick={handleAdd}>添加提词</Button>
        </div>

        <Table
          columns={columns}
          dataSource={promptList}
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
        title={editingPrompt ? "修改提词" : "添加提词"}
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={[
          <Button key="back" onClick={() => setVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>确定</Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8 }}>名称</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="请输入提词名称"
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8 }}>提词内容</label>
          <Input.TextArea
            value={formData.promptQuery}
            onChange={(e) => setFormData(prev => ({ ...prev, promptQuery: e.target.value }))}
            placeholder="请输入提词内容"
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
};
export default PromptListPage;