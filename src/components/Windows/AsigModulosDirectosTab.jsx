import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Table, 
    Button, 
    Switch, 
    Tag, 
    Tooltip, 
    Modal, 
    Select, 
    Space, 
    Typography, 
    Alert,
    Progress,
    Dropdown,
    Menu,
    Row,
    Col,
    Statistic,
    Divider,
    notification,
    Spin,
    Badge
} from 'antd';

import { 
    UserOutlined, 
    SettingOutlined, 
    CheckCircleOutlined, 
    CloseCircleOutlined,
    CopyOutlined,
    ThunderboltOutlined,
    AppstoreOutlined,
    EyeOutlined,
    MoreOutlined,
    ReloadOutlined,
    PlusOutlined,
    MinusOutlined
} from '@ant-design/icons';

import apiService from "../../services/apiService";

const { Title, Text } = Typography;
const { Option } = Select;

const AsigModulosDirectosTab = () => {
    // ============== ESTADO ==============
    const [perfiles, setPerfiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPerfil, setSelectedPerfil] = useState(null);
    const [modulosDirectos, setModulosDirectos] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(''); // 'copy', 'masiva'
    const [processingModulo, setProcessingModulo] = useState(null);
    
    // Estados para modales
    const [copyModalVisible, setCopyModalVisible] = useState(false);
    const [masiveModalVisible, setMasiveModalVisible] = useState(false);
    const [perfilOrigen, setPerfilOrigen] = useState(null);
    const [perfilDestino, setPerfilDestino] = useState(null);
    const [sobrescribir, setSobrescribir] = useState(false);

    // ============== EFECTOS ==============
    useEffect(() => {
        cargarPerfiles();
    }, []);

    useEffect(() => {
        if (selectedPerfil) {
            cargarModulosDirectos(selectedPerfil.per_id);
        }
    }, [selectedPerfil]);

    // ============== FUNCIONES API ==============
    const cargarPerfiles = async () => {
        setLoading(true);
        try {
            const response = await apiService.get('/direct-modules/perfiles');
            if (response.data.status === 'success') {
                setPerfiles(response.data.perfiles);
                if (response.data.perfiles.length > 0) {
                    setSelectedPerfil(response.data.perfiles[0]);
                }
            }
        } catch (error) {
            notification.error({
                message: 'Error',
                description: 'Error al cargar perfiles'
            });
        } finally {
            setLoading(false);
        }
    };

    const cargarModulosDirectos = async (perfilId) => {
        setLoading(true);
        try {
            const response = await apiService.get(`/direct-modules/perfiles/${perfilId}`);
            if (response.data.status === 'success') {
                setModulosDirectos(response.data.modulos_directos);
            }
        } catch (error) {
            notification.error({
                message: 'Error',
                description: 'Error al cargar módulos directos'
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleModuloAccess = async (modulo, grantAccess) => {
        setProcessingModulo(`${modulo.men_id}-${modulo.sub_id}-${modulo.opc_id}`);
        
        try {
            const payload = {
                men_id: modulo.men_id,
                sub_id: modulo.sub_id,
                opc_id: modulo.opc_id,
                grant_access: grantAccess,
                tipo: modulo.tipo
            };

            const response = await apiService.post(
                `/direct-modules/perfiles/${selectedPerfil.per_id}/toggle`, 
                payload
            );

            if (response.data.status === 'success') {
                notification.success({
                    message: 'Éxito',
                    description: response.data.message
                });
                
                // Recargar datos
                await cargarModulosDirectos(selectedPerfil.per_id);
                await cargarPerfiles(); // Para actualizar estadísticas
            }
        } catch (error) {
            notification.error({
                message: 'Error',
                description: error.response?.data?.message || 'Error al modificar acceso'
            });
        } finally {
            setProcessingModulo(null);
        }
    };

    const asignacionMasiva = async (accion) => {
        setLoading(true);
        try {
            const payload = {
                accion: accion,
                modulos_especificos: modulosDirectos.map(m => ({
                    men_id: m.men_id,
                    sub_id: m.sub_id,
                    opc_id: m.opc_id,
                    tipo: m.tipo
                }))
            };

            const response = await apiService.post(
                `/direct-modules/perfiles/${selectedPerfil.per_id}/asignacion-masiva`,
                payload
            );

            if (response.data.status === 'success') {
                notification.success({
                    message: 'Asignación Masiva Completada',
                    description: `${response.data.estadisticas.modulos_procesados} módulos procesados`
                });

                await cargarModulosDirectos(selectedPerfil.per_id);
                await cargarPerfiles();
                setMasiveModalVisible(false);
            }
        } catch (error) {
            notification.error({
                message: 'Error en Asignación Masiva',
                description: error.response?.data?.message || 'Error al procesar asignación masiva'
            });
        } finally {
            setLoading(false);
        }
    };

    const copiarConfiguracion = async () => {
        if (!perfilOrigen || !perfilDestino) {
            notification.warning({
                message: 'Datos Incompletos',
                description: 'Selecciona perfil origen y destino'
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                perfil_origen_id: perfilOrigen,
                perfil_destino_id: perfilDestino,
                sobrescribir: sobrescribir
            };

            const response = await apiService.post('/direct-modules/copiar-configuracion', payload);

            if (response.data.status === 'success') {
                notification.success({
                    message: 'Configuración Copiada',
                    description: 'La configuración se copió correctamente'
                });

                await cargarPerfiles();
                setCopyModalVisible(false);
                setPerfilOrigen(null);
                setPerfilDestino(null);
                setSobrescribir(false);
            }
        } catch (error) {
            notification.error({
                message: 'Error al Copiar',
                description: error.response?.data?.message || 'Error al copiar configuración'
            });
        } finally {
            setLoading(false);
        }
    };

    // ============== COMPONENTES AUXILIARES ==============
    const renderEstadisticas = () => {
        if (!selectedPerfil) return null;

        const stats = selectedPerfil.estadisticas;
        return (
            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                    <Statistic 
                        title="Total Módulos Directos"
                        value={stats.total_modulos_directos}
                        prefix={<AppstoreOutlined />}
                    />
                </Col>
                <Col span={6}>
                    <Statistic 
                        title="Con Acceso"
                        value={stats.modulos_con_acceso}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                    />
                </Col>
                <Col span={6}>
                    <Statistic 
                        title="Con Botones"
                        value={stats.modulos_con_botones}
                        prefix={<SettingOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                    />
                </Col>
                <Col span={6}>
                    <Progress 
                        type="circle" 
                        size={60}
                        percent={Math.round((stats.modulos_con_acceso / stats.total_modulos_directos) * 100)}
                        format={() => `${Math.round((stats.modulos_con_acceso / stats.total_modulos_directos) * 100)}%`}
                    />
                </Col>
            </Row>
        );
    };

    const getActionMenu = (modulo) => (
        <Menu>
            <Menu.Item 
                key="toggle"
                icon={modulo.tiene_acceso ? <MinusOutlined /> : <PlusOutlined />}
                onClick={() => toggleModuloAccess(modulo, !modulo.tiene_acceso)}
            >
                {modulo.tiene_acceso ? 'Revocar Acceso' : 'Otorgar Acceso'}
            </Menu.Item>
            <Menu.Item 
                key="view"
                icon={<EyeOutlined />}
                onClick={() => {
                    // Modal con detalles del módulo
                    Modal.info({
                        title: `Detalles: ${modulo.nombre}`,
                        content: (
                            <div>
                                <p><strong>Tipo:</strong> {modulo.tipo}</p>
                                <p><strong>Componente:</strong> {modulo.componente || 'N/A'}</p>
                                <p><strong>Botones configurados:</strong> {modulo.botones_configurados}</p>
                                <p><strong>Botones con permiso:</strong> {modulo.botones_con_permiso}</p>
                            </div>
                        )
                    });
                }}
            >
                Ver Detalles
            </Menu.Item>
        </Menu>
    );

    // ============== COLUMNAS DE LA TABLA ==============
    const columns = [
        {
            title: 'Módulo',
            dataIndex: 'nombre',
            key: 'nombre',
            render: (text, record) => (
                <Space direction="vertical" size="small">
                    <Text strong>{text}</Text>
                    <Tag color={record.tipo === 'menu' ? 'blue' : record.tipo === 'submenu' ? 'green' : 'orange'}>
                        {record.tipo.toUpperCase()}
                    </Tag>
                </Space>
            )
        },
        {
            title: 'Componente',
            dataIndex: 'componente',
            key: 'componente',
            render: (text) => text || <Text type="secondary">Sin componente</Text>
        },
        {
            title: 'Estado de Acceso',
            key: 'acceso',
            align: 'center',
            render: (_, record) => (
                <Space direction="vertical" size="small" style={{ textAlign: 'center' }}>
                    <Switch
                        checked={record.tiene_acceso}
                        loading={processingModulo === `${record.men_id}-${record.sub_id}-${record.opc_id}`}
                        onChange={(checked) => toggleModuloAccess(record, checked)}
                        checkedChildren={<CheckCircleOutlined />}
                        unCheckedChildren={<CloseCircleOutlined />}
                    />
                    {record.tiene_acceso ? (
                        <Tag color="success">Con Acceso</Tag>
                    ) : (
                        <Tag color="default">Sin Acceso</Tag>
                    )}
                </Space>
            )
        },
        {
            title: 'Botones',
            key: 'botones',
            align: 'center',
            render: (_, record) => (
                <Space direction="vertical" size="small" style={{ textAlign: 'center' }}>
                    <Badge 
                        count={record.botones_con_permiso} 
                        overflowCount={99}
                        style={{ backgroundColor: record.botones_con_permiso > 0 ? '#52c41a' : '#d9d9d9' }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.botones_con_permiso} / {record.botones_configurados}
                    </Text>
                    {record.botones_configurados > 0 && (
                        <Progress 
                            percent={Math.round((record.botones_con_permiso / record.botones_configurados) * 100)}
                            size="small"
                            status={record.botones_con_permiso === record.botones_configurados ? 'success' : 'active'}
                        />
                    )}
                </Space>
            )
        },
        {
            title: 'Acciones',
            key: 'acciones',
            align: 'center',
            render: (_, record) => (
                <Dropdown overlay={getActionMenu(record)} trigger={['click']}>
                    <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
            )
        }
    ];

    // ============== RENDER ==============
    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Title level={3}>
                    <AppstoreOutlined /> Asignación de Módulos Directos
                </Title>
                <Text type="secondary">
                    Gestiona el acceso de los perfiles a módulos con ventana directa
                </Text>
            </div>

            {/* Selector de Perfil */}
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={16} align="middle">
                    <Col span={12}>
                        <Space>
                            <UserOutlined />
                            <Text strong>Perfil:</Text>
                            <Select
                                style={{ width: 300 }}
                                placeholder="Seleccionar perfil"
                                value={selectedPerfil?.per_id}
                                onChange={(value) => {
                                    const perfil = perfiles.find(p => p.per_id === value);
                                    setSelectedPerfil(perfil);
                                }}
                                loading={loading}
                            >
                                {perfiles.map(perfil => (
                                    <Option key={perfil.per_id} value={perfil.per_id}>
                                        <Space>
                                            {perfil.per_nom}
                                            <Badge 
                                                count={perfil.estadisticas?.modulos_con_acceso || 0}
                                                style={{ backgroundColor: '#52c41a' }}
                                            />
                                        </Space>
                                    </Option>
                                ))}
                            </Select>
                        </Space>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button 
                                icon={<ReloadOutlined />} 
                                onClick={cargarPerfiles}
                                loading={loading}
                            >
                                Recargar
                            </Button>
                            <Button 
                                type="primary" 
                                icon={<ThunderboltOutlined />}
                                onClick={() => setMasiveModalVisible(true)}
                                disabled={!selectedPerfil}
                            >
                                Asignación Masiva
                            </Button>
                            <Button 
                                icon={<CopyOutlined />}
                                onClick={() => setCopyModalVisible(true)}
                            >
                                Copiar Configuración
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Estadísticas */}
            {selectedPerfil && (
                <Card style={{ marginBottom: 16 }}>
                    <Title level={5}>Estadísticas del Perfil: {selectedPerfil.per_nom}</Title>
                    {renderEstadisticas()}
                </Card>
            )}

            {/* Tabla de Módulos */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={modulosDirectos}
                    rowKey={(record) => `${record.men_id}-${record.sub_id}-${record.opc_id}`}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} módulos`
                    }}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* Modal de Asignación Masiva */}
            <Modal
                title="Asignación Masiva de Módulos Directos"
                visible={masiveModalVisible}
                onCancel={() => setMasiveModalVisible(false)}
                footer={null}
                width={600}
            >
                <Alert
                    message="Asignación Masiva"
                    description={`Se aplicará la acción seleccionada a todos los módulos directos del perfil: ${selectedPerfil?.per_nom}`}
                    type="info"
                    style={{ marginBottom: 16 }}
                />

                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Button 
                        type="primary" 
                        size="large" 
                        block
                        icon={<CheckCircleOutlined />}
                        onClick={() => asignacionMasiva('otorgar_todos')}
                        loading={loading}
                    >
                        Otorgar Acceso a Todos los Módulos
                    </Button>

                    <Button 
                        danger 
                        size="large" 
                        block
                        icon={<CloseCircleOutlined />}
                        onClick={() => asignacionMasiva('revocar_todos')}
                        loading={loading}
                    >
                        Revocar Acceso a Todos los Módulos
                    </Button>

                    <Button 
                        size="large" 
                        block
                        icon={<EyeOutlined />}
                        onClick={() => asignacionMasiva('solo_lectura')}
                        loading={loading}
                    >
                        Solo Permisos de Lectura
                    </Button>
                </Space>
            </Modal>

            {/* Modal de Copiar Configuración */}
            <Modal
                title="Copiar Configuración de Módulos Directos"
                visible={copyModalVisible}
                onCancel={() => setCopyModalVisible(false)}
                onOk={copiarConfiguracion}
                confirmLoading={loading}
                okText="Copiar"
                cancelText="Cancelar"
            >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                        <Text strong>Perfil Origen:</Text>
                        <Select
                            style={{ width: '100%', marginTop: 8 }}
                            placeholder="Seleccionar perfil origen"
                            value={perfilOrigen}
                            onChange={setPerfilOrigen}
                        >
                            {perfiles.map(perfil => (
                                <Option key={perfil.per_id} value={perfil.per_id}>
                                    {perfil.per_nom} ({perfil.estadisticas?.modulos_con_acceso || 0} módulos)
                                </Option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <Text strong>Perfil Destino:</Text>
                        <Select
                            style={{ width: '100%', marginTop: 8 }}
                            placeholder="Seleccionar perfil destino"
                            value={perfilDestino}
                            onChange={setPerfilDestino}
                        >
                            {perfiles.filter(p => p.per_id !== perfilOrigen).map(perfil => (
                                <Option key={perfil.per_id} value={perfil.per_id}>
                                    {perfil.per_nom} ({perfil.estadisticas?.modulos_con_acceso || 0} módulos)
                                </Option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <Switch
                            checked={sobrescribir}
                            onChange={setSobrescribir}
                        />
                        <Text style={{ marginLeft: 8 }}>
                            Sobrescribir configuración existente
                        </Text>
                    </div>

                    <Alert
                        message="Información"
                        description="Se copiará toda la configuración de módulos directos del perfil origen al perfil destino."
                        type="info"
                    />
                </Space>
            </Modal>
        </div>
    );
};

export default AsigModulosDirectosTab;