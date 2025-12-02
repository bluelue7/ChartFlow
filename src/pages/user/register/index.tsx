import { Footer } from '@/components';
import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormText,
} from '@ant-design/pro-components';
import { Helmet } from '@umijs/max';
import { App } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import Settings from '../../../../config/defaultSettings';
import { Link, history } from '@@/exports';
import { userRegisterUsingPost } from '@/services/chart-flow/userController';

const useStyles = createStyles(({ token }) => {
  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
    loginLink: {
      float: 'right',
      color: token.colorPrimary,
      '&:hover': {
        color: token.colorPrimaryHover,
      },
    },
    linksContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    formContainer: {
      minWidth: 280,
      maxWidth: '75vw',
      margin: '0 auto',
    },
    successMessage: {
      textAlign: 'center',
      padding: '20px 0',
    },
  };
});

const Register: React.FC = () => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<{ userAccount?: string }>({});

  const handleSubmit = async (values: API.UserRegisterRequest) => {
    try {
      // 检查密码和确认密码是否一致
      if (values.checkPassword !== values.userPassword) {
        message.error('两次输入的密码不一致！');
        return;
      }

      // 注册
      const res = await userRegisterUsingPost({
        ...values,
      });
      
      if (res.code === 0) {
        const defaultRegisterSuccessMessage = '注册成功！';
        message.success(defaultRegisterSuccessMessage);
        
        // 设置注册成功状态
        setRegisteredUser({ userAccount: values.userAccount });
        setRegisterSuccess(true);
        
        // 3秒后自动跳转到登录页
        setTimeout(() => {
          history.push('/user/login');
        }, 3000);
      } else {
        message.error(res.message || '注册失败，请重试！');
      }
    } catch (error) {
      const defaultRegisterFailureMessage = '注册失败，请重试！';
      console.log(error);
      message.error(defaultRegisterFailureMessage);
    }
  };

  if (registerSuccess) {
    return (
      <div className={styles.container}>
        <Helmet>
          <title>
            {'注册成功'}
            {Settings.title && ` - ${Settings.title}`}
          </title>
        </Helmet>
        <div
          style={{
            flex: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 0',
          }}
        >
          <div className={styles.formContainer}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img alt="logo" src="/logo.svg" style={{ height: 60 }} />
              <h2 style={{ marginTop: 16, marginBottom: 8 }}>Smart BI</h2>
              <p style={{ marginBottom: 32, color: 'rgba(0,0,0,0.45)' }}>
                更智能的数据分析，更明智的商业决策
              </p>
            </div>
            
            <div className={styles.successMessage}>
              <h3 style={{ color: '#52c41a', marginBottom: 16 }}> 注册成功！</h3>
              <p style={{ marginBottom: 8 }}>用户名: <strong>{registeredUser.userAccount}</strong></p>
              <p style={{ marginBottom: 24, color: 'rgba(0,0,0,0.45)' }}>
                系统将在3秒后自动跳转到登录页面
              </p>
              <Link to="/user/login" className={styles.loginLink}>
                立即登录
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {'注册'}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          submitter={{
            searchConfig: {
              submitText: '注册',
            },
          }}
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src="/logo.svg" />}
          title="Smart BI"
          subTitle={'Smart BI 更智能的数据分析，更明智的商业决策'}
          onFinish={async (values) => {
            await handleSubmit(values as API.UserRegisterRequest);
          }}
        >
          <ProFormText
            name="userAccount"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined />,
            }}
            placeholder={'请输入用户名 (至少4个字符)'}
            rules={[
              {
                required: true,
                message: '用户名是必填项！',
              },
              {
                min: 4,
                message: '用户名至少4个字符！',
              },
            ]}
          />
          
          <ProFormText.Password
            name="userPassword"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder={'请输入密码 (至少8个字符)'}
            rules={[
              {
                required: true,
                message: '密码是必填项！',
              },
              {
                min: 8,
                message: '密码至少8个字符！',
              },
            ]}
          />
          
          <ProFormText.Password
            name="checkPassword"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder={'请确认密码'}
            rules={[
              {
                required: true,
                message: '确认密码是必填项！',
              },
            ]}
          />

          <div className={styles.linksContainer}>
            <Link to="/user/login" className={styles.loginLink}>
              已有账号？立即登录
            </Link>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Register;