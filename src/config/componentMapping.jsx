// src/config/componentMapping.js - LIMPIO Y FUNCIONAL
import React from 'react';

// Importar componentes de ventanas
import AccountsWindow from '../components/Windows/AccountsWindow';
import ReportsWindow from '../components/Windows/ReportsWindow';
import SettingsWindow from '../components/Windows/SettingsWindow';
import TransactionsWindow from '../components/Windows/TransactionsWindow';
import ClientsWindow from '../components/Windows/ClientsWindow';
import ParameWindows from '../components/Windows/ParameWindows';
import AsgiPerWindows from '../components/Windows/AsgiPerWindows';
import UsuParamWindow from '../components/Windows/UsuParamWindow';
import ConfigWindow from '../components/Windows/ConfigWindow';
import TiOficinWindow from '../components/Windows/TiOficinWindow';
import OficinasWindow from '../components/Windows/OficinasWindow';
import UsuParamWindowCrear from '../components/Windows/UsuParamWindowCrear';
import UsuParamWindowEditar from '../components/Windows/UsuParamWindowEditar';
import ThemeConfigWindow from '../components/Windows/ThemeConfigWindow';
import LogoConfigWindow from '../components/Windows/LogoConfigWindow'; // Importar el nuevo componente de configuración de tema

// Componente por defecto para desarrollo
const DefaultWindow = ({ title, data, componentName }) => {
  return React.createElement('div', { className: 'p-6 bg-gray-50 h-full' },
    React.createElement('h2', { className: 'text-xl font-bold mb-4 text-gray-800' }, title),
    React.createElement('div', { className: 'space-y-4' },
      React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-md p-4' },
        React.createElement('p', { className: 'text-blue-800 text-sm' },
          React.createElement('strong', null, 'Componente: '), componentName
        ),
        React.createElement('p', { className: 'text-blue-700 text-sm mt-1' },
          'Este componente está en desarrollo.'
        )
      ),
      data && React.createElement('details', { className: 'bg-white p-4 rounded-md border' },
        React.createElement('summary', { className: 'cursor-pointer font-medium text-gray-700 mb-2' },
          'Ver datos del elemento'
        ),
        React.createElement('pre', { className: 'text-xs bg-gray-100 p-3 rounded border overflow-auto max-h-60' },
          JSON.stringify(data, null, 2)
        )
      )
    )
  );
};

// Mapeo de componentes por nombre
export const componentMap = {
  'ParameWindows': ParameWindows,
  'AsgiPerWindows': AsgiPerWindows,
  'AccountsWindow': AccountsWindow,
  'ReportsWindow': ReportsWindow,
  'SettingsWindow': SettingsWindow,
  'TransactionsWindow': TransactionsWindow,
  'ClientsWindow': ClientsWindow,
  'UsuParamWindow': UsuParamWindow,
  'ConfigWindow': ConfigWindow,
  'OficinasWindow': OficinasWindow,
  'TiOficinWindow': TiOficinWindow,
  'UsuParamWindowCrear': UsuParamWindowCrear,
  'UsuParamWindowEditar': UsuParamWindowEditar,
  'ThemeConfigWindow': ThemeConfigWindow, // ← AGREGAR EL NUEVO COMPONENTE AQUÍ
  'LogoConfigWindow': LogoConfigWindow, // ← AGREGAR EL NUEVO COMPONENTE AQUÍ
  // Componentes con props de submódulo
  'ClientRegistry': (props) => <ClientsWindow {...props} subModule="registry" />,
  'ClientSearch': (props) => <ClientsWindow {...props} subModule="search" />,
  'ClientCorporate': (props) => <ClientsWindow {...props} subModule="corporate" />,

  'SavingsAccounts': (props) => <AccountsWindow {...props} subModule="savings" />,
  'CreditAccounts': (props) => <AccountsWindow {...props} subModule="credit" />,
  'FixedTermAccounts': (props) => <AccountsWindow {...props} subModule="fixed-term" />,

  'DepositsTransactions': (props) => <TransactionsWindow {...props} subModule="deposits" />,
  'WithdrawalsTransactions': (props) => <TransactionsWindow {...props} subModule="withdrawals" />,
  'TransfersTransactions': (props) => <TransactionsWindow {...props} subModule="transfers" />,

  'FinancialReports': (props) => <ReportsWindow {...props} subModule="financial" />,
  'ClientReports': (props) => <ReportsWindow {...props} subModule="clients" />,
  'OperationsReports': (props) => <ReportsWindow {...props} subModule="operations" />,

  'Default': DefaultWindow,
};

console.log('ComponentMap loaded:', componentMap);
console.log('ParameWindows in map:', componentMap.ParameWindows);

export const getComponent = (componentName, fallbackTitle = 'Ventana') => {
  console.log('Getting component:', componentName);
  if (!componentName) {
    return (props) => <DefaultWindow {...props} title={fallbackTitle} componentName="Sin definir" />;
  }
  const Component = componentMap[componentName];
  console.log('Component found:', Component);
  if (!Component) {
    return (props) => <DefaultWindow {...props} title={fallbackTitle} componentName={componentName} />;
  }
  return Component;
};

export const defaultWindowConfig = {
  width: 800,
  height: 600,
  minWidth: 400,
  minHeight: 300,
  resizable: true,
  draggable: true,
  centered: false,
};

export const componentConfig = {
  'ParameWindows': {
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'Parametrización de Módulos',
  },
  'AsgiPerWindows': {
    width: 900,
    height: 650,
    minWidth: 700,
    minHeight: 500,
    title: 'Asignación de Permisos',
  },
  'AccountsWindow': {
    width: 850,
    height: 600,
    title: 'Gestión de Cuentas',
  },
  'ClientsWindow': {
    width: 900,
    height: 650,
    title: 'Gestión de Clientes',
  },
  'TransactionsWindow': {
    width: 800,
    height: 550,
    title: 'Transacciones',
  },
  'ReportsWindow': {
    width: 950,
    height: 700,
    title: 'Reportes',
  },
  'SettingsWindow': {
    width: 700,
    height: 500,
    title: 'Configuración',
  },
  'UsuParamWindow': {
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'Parametrización de Usuarios',
  },
  'ConfigWindow': {
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'Configuración del Sistema',
  },
  'OficinasWindow': {
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'Configuración del Oficinas',
    },
  'TiOficinWindow':{
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'Configuración del tipo de  Oficinas',
    },
    'UsuParamWindowCrear':{
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'Configuración del tipo de  Oficinas',
    },
    'UsuParamWindowEditar':{
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'Configuración del tipo de  Oficinas',
    },
  'ThemeConfigWindow': {
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    title: 'Configuración de Colores y Tema',
  },
  'LogoConfigWindow': {
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    title: 'Configuración de Logo',
  },
  'CrearCalendarWindow': {
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    title: 'Configuración de Calendario',
  },
};

export const getWindowConfig = (componentName) => {
  const config = componentConfig[componentName] || {};
  return {
    ...defaultWindowConfig,
    ...config,
  };
};

export const mapApiDataToProps = (menuData, submenuData = null, optionData = null) => {
  return {
    menuData,
    submenuData,
    optionData,
    title: optionData?.opc_nom || submenuData?.sub_nom || menuData?.men_nom || 'Ventana',
    menuId: menuData?.men_id,
    submenuId: submenuData?.sub_id,
    optionId: optionData?.opc_id,
  };
};

export default {
  componentMap,
  getComponent,
  getWindowConfig,
  mapApiDataToProps,
};
