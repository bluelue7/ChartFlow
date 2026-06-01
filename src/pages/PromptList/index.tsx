import { addPromptUsingPost, deletePromptUsingDelete, updatePromptUsingPut, getMyPromptListUsingGet, getPromptListPageUsingPost } from "@/services/chart-flow/promptController";
import { useModel } from "@@/exports";
import { Card, Input, Button, Modal, Table, message, Space } from "antd";
import React, { useEffect, useState } from "react";

// 后端固定模板后缀（用户不能修改的部分）
const FIXED_TEMPLATE_SUFFIX: string = `

用户会提供：
1. 分析需求
2. 用户指定的图表类型（可为空）
3. CSV格式数据

你的任务：
1. 识别最适合的数据可视化类型
2. 提取核心分析字段
3. 输出标准JSON
4. 给出数据分析结论

【重要规则】
1. 只能输出合法JSON
2. 不要输出 markdown
3. 不要输出 \`\`\` json 或 \`\`\`
4. 不要输出解释文字
5. 所有 key 必须使用双引号
6. 不允许出现注释
7. 不允许出现 function
8. 不允许输出 ECharts option
9. 输出必须可以被 Jackson/Fastjson 直接解析

【固定输出格式】
【【【【【
{"chartType":"bar","title":"标题","xField":"X轴字段名","yField":"Y轴字段名","categories":["分类1","分类2"],"series":[{"name":"系列名称","data":[100,200]}],"radarIndicator":[{"name":"指标1","max":100}],"conclusion":"数据分析结论"}
【【【【【

【chartType规则】
1. 如果用户指定了 chartType（如 bar/line/pie/scatter/radar/stack）：
   - 必须严格使用用户指定的值
   - 不允许修改
   - 不允许自行选择其他图表类型
2. 如果用户没有指定 chartType：
   - 根据数据特征和分析需求自动选择最合适的图表类型

【chartType允许值】
- bar（分类对比）
- line（时间趋势）
- pie（占比分析）
- scatter（相关性分析）,scatter数据格式：series.data 必须是 [[x1,y1], [x2,y2], ...] 格式，每个数据点包含 x 和 y 值。
- radar（多维指标），radar数据格式categories 为雷达图维度名称列表，series.data 为数值列表，长度必须与 categories 一致。如果未提供 radarIndicator，系统会根据 categories 自动生成（max=100）。

现在开始分析：
====================
分析需求：
%s
用户指定的图表类型：
%s
原始数据：
%s`;

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
    customPrefix: "", // 用户自定义的开头部分，如"你是一个专业的数据分析助手。"
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
    setFormData({ name: "", customPrefix: "" });
    setVisible(true);
  };

  const handleEdit = (prompt: API.Prompt) => {
    setEditingPrompt(prompt);
    // 从现有模板中提取用户自定义的前缀部分（"用户会提供："之前的内容）
    const promptQuery = (prompt as any).promptQuery || "";
    const prefixEndIndex = promptQuery.indexOf("\n用户会提供：");
    const customPrefix = prefixEndIndex > 0 
      ? promptQuery.substring(0, prefixEndIndex)
      : "你是一个专业的数据分析助手。";
    
    setFormData({
      name: prompt.name || "",
      customPrefix: customPrefix,
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
    if (!formData.name) {
      message.error("请填写提词名称");
      return;
    }
    // 使用默认前缀如果用户没有输入
    const prefix = formData.customPrefix || "你是一个专业的数据分析助手。";
    // 将用户输入的前缀和固定模板后缀合并
    const promptQuery = prefix + FIXED_TEMPLATE_SUFFIX;
    
    try {
      let res;
      if (editingPrompt) {
        res = await updatePromptUsingPut({
          id: editingPrompt.id,
          name: formData.name,
          promptQuery: promptQuery,
        });
      } else {
        res = await addPromptUsingPost({ name: formData.name, promptQuery: promptQuery });
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
          <label style={{ display: "block", marginBottom: 8 }}>自定义开头（如：你是一个专业的数据分析助手。）</label>
          <Input.TextArea
            value={formData.customPrefix}
            onChange={(e) => setFormData(prev => ({ ...prev, customPrefix: e.target.value }))}
            placeholder="请输入自定义开头，例如：你是一个专业的数据分析助手。\n系统会自动添加后续的分析规则和格式要求。"
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
};
export default PromptListPage;