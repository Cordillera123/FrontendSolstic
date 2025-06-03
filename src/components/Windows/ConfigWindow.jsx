import React from 'react';
import Icon from '../UI/Icon'; // Asegúrate que esta ruta exista y sea válida

const ConfigWindow = () => {
  const styles = {
    container: {
      padding: '2rem',
      backgroundColor: '#f0f9ff',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#0c4a6e',
      marginBottom: '1rem'
    },
    icon: {
      marginBottom: '1rem'
    },
    subtitle: {
      fontSize: '1rem',
      color: '#475569'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.icon}>
        <Icon name="Smile" size={48} color="#0ea5e9" />
      </div>
      <div style={styles.title}>¡Hola Mundo!</div>
      <div style={styles.subtitle}>Este es un componente de prueba en React.</div>
    </div>
  );
};

export default ConfigWindow;
