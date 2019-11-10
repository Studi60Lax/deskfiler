import store from 'store';

import useAuth from './useAuth';

export default () => {
  const [auth, setAuth] = useAuth();

  const apiCall = async (url, params) => {
    try {
      const response = await fetch(url, {
        ...params,
        headers: {
          credentials: 'include',
          Cookie: `PHPSESSID=${auth.token}`,
          Authorization: `Basic ${btoa('a:b')}`,
          ...params.header,
        },
      });

      const json = await response.json();
      if (json.error) throw new Error(json.error);
      return json;
    } catch (err) {
      if (err.message.startsWith('Session expired')) {
        await store.set('authToken', null);
        setAuth(null);
      } else {
        throw err;
      }
      return false;
    }
  };

  const addPluginToAccount = async ({ pluginKey }) => {
    const url = 'https://plugins.deskfiler.org/api/index.php';

    const formData = {
      appaction: 'plugadd',
      appid: pluginKey.split('-').join(''),
      appname: 'deskfiler',
    };

    const body = new FormData();

    Object.keys(formData).forEach((key) => {
      body.append(key, formData[key]);
    });

    return apiCall(url, {
      body,
      method: 'POST',
    });
  };

  const removePluginFromAccount = async ({ pluginKey }) => {
    const url = 'https://plugins.deskfiler.org/api/index.php';

    const formData = {
      appaction: 'plugremove',
      appid: pluginKey.split('-').join(''),
      appname: 'deskfiler',
    };
    const body = new FormData();

    Object.keys(formData).forEach((key) => {
      body.append(key, formData[key]);
    });

    return apiCall(url, {
      method: 'POST',
      body,
    });
  };


  const getPluginInfo = async ({ pluginKey }) => {
    const url = 'https://plugins.deskfiler.org/api/index.php';

    const formData = {
      appaction: 'pluginfo',
      appid: pluginKey.split('-').join(''),
      appname: 'deskfiler',
    };
    try {
      const body = new FormData();

      Object.keys(formData).forEach((key) => {
        body.append(key, formData[key]);
      });

      const { data, success } = await apiCall(url, { method: 'POST', body });

      return {
        isRegistered: success && data.userplugin,
        ticket: data,
      };
    } catch (err) {
      return {
        isRegistered: false,
      };
    }
  };

  return { getPluginInfo, addPluginToAccount, removePluginFromAccount };
};
