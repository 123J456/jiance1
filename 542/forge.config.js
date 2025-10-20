module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'icon.ico',
    name: '芯片数据实时接收系统',
    executableName: '芯片数据接收系统',
    appBundleId: 'com.example.chipdatareceiver',
    win32metadata: {
      CompanyName: '芯片数据接收系统',
      FileDescription: '芯片数据实时接收系统',
      OriginalFilename: '芯片数据接收系统.exe',
      ProductName: '芯片数据接收系统',
      InternalName: '芯片数据实时接收系统'
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'chip_data_receiver',
        setupExe: '芯片数据实时接收系统安装程序.exe',
        setupIcon: 'icon.ico',
        loadingGif: 'loading.gif'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
