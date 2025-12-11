export default [
  {
    path: '/user',
    layout: false,
    routes: [
      { name: '登录', path: '/user/login', component: './user/login' },
      { name: '注册', path: '/user/register', component: './user/register' },
    ],
  },
  { path: '/welcome', name: '欢迎', icon: 'smile', component: './Welcome' },
  { path: '/add_chart', name: '智能分析（同步）', icon: 'barChartOutlined', component: './AddChart' },
  { path: '/add_chart_async', name: '智能分析（异步）', icon: 'barChartOutlined', component: './AddChartAsync' },
  { path: '/my_chart', name: '图表列表', icon: 'pieChartOutlined', component: './MyChart' },
  {
    path: '/admin',
    name: '管理页',
    icon: 'crown',
    access: 'canAdmin',
    routes: [
      { path: '/admin', redirect: '/admin/sub-page' },
      { path: '/admin/sub-page', name: '二级管理页', component: './Admin' },
    ],
  },
  { name: '查询表格', icon: 'table', path: '/list', component: './table-list' },
  { path: '/', redirect: '/welcome' },
  { path: '*', layout: false, component: './404' },
];
