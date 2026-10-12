import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';

export default function App() {
  const [mensaje, setMensaje] = useState('');
  const [remitente, setRemitente] = useState('');
  const [esUrgente, setEsUrgente] = useState(false);
  const [esContenidoSensible, setEsContenidoSensible] = useState(false);
  const [estadoResultado, setEstadoResultado] =
    useState('Esperando análisis...');

  const evaluarSeguridad = () => {
    if (mensaje === '' || remitente === '') {
      Alert.alert(
        'Campos vacíos',
        'Por favor ingresa el remitente y el contenido del mensaje.'
      );
      return;
    }

    const tieneEnlace =
      mensaje.includes('http') || mensaje.includes('.com');

    const remitenteDesconocido =
      remitente.toLowerCase().includes('desconocido') ||
      remitente.includes('+');

    const esPhishing =
      tieneEnlace && (remitenteDesconocido || esUrgente);

    const estaBloqueado =
      esPhishing || esContenidoSensible;

    if (estaBloqueado) {
      setEstadoResultado('¡Amenaza Bloqueada!');
    } else {
      setEstadoResultado('Mensaje Verificado: Seguro');
    }
  };

  return (
    <View style={estilos.contenedor}>

      {/* ENCABEZADO */}
      <View style={estilos.encabezado}>
        <Text style={estilos.tituloEncabezado}>
          SafeGuard IA
        </Text>

        <Text style={estilos.subtituloEncabezado}>
          Panel de Control
        </Text>
      </View>

      {/* TARJETA PRINCIPAL */}
      <View style={estilos.tarjeta}>

        {/* REMITENTE */}
        <Text style={estilos.etiqueta}>
          Remitente:
        </Text>

        <TextInput
          style={estilos.entradaTexto}
          placeholder="Ejemplo: usuario@gmail.com"
          value={remitente}
          onChangeText={setRemitente}
          autoCapitalize="none"
        />

        {/* MENSAJE */}
        <Text style={estilos.etiqueta}>
          Mensaje recibido:
        </Text>

        <TextInput
          style={[estilos.entradaTexto, estilos.areaTexto]}
          placeholder="Escribe aquí el mensaje recibido..."
          value={mensaje}
          onChangeText={setMensaje}
          multiline
        />

        {/* URGENCIA */}
        <View style={estilos.filaOpcion}>
          <Text style={estilos.textoOpcion}>
            ¿Contiene tono de urgencia?
          </Text>

          <Switch
            value={esUrgente}
            onValueChange={setEsUrgente}
          />
        </View>

        {/* IMAGEN SENSIBLE */}
        <View style={estilos.filaOpcion}>
          <Text style={estilos.textoOpcion}>
            ¿Detecta imagen sensible?
          </Text>

          <Switch
            value={esContenidoSensible}
            onValueChange={setEsContenidoSensible}
          />
        </View>

        {/* BOTÓN */}
        <TouchableOpacity
          style={estilos.boton}
          onPress={evaluarSeguridad}
        >
          <Text style={estilos.textoBoton}>
            Ejecutar Evaluación
          </Text>
        </TouchableOpacity>

      </View>

      {/* RESULTADO */}
      <View style={estilos.contenedorResultado}>
        <Text style={estilos.etiquetaResultado}>
          Dictamen:
        </Text>

        <Text style={estilos.valorResultado}>
          {estadoResultado}
        </Text>
      </View>

    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    paddingTop: 40,
  },

  encabezado: {
    backgroundColor: '#1a1f2c',
    padding: 20,
    alignItems: 'center',
  },

  tituloEncabezado: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },

  subtituloEncabezado: {
    color: '#9aa5b5',
    fontSize: 14,
    marginTop: 4,
  },

  tarjeta: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
  },

  etiqueta: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
  },

  entradaTexto: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    backgroundColor: '#fafafa',
  },

  areaTexto: {
    height: 80,
    textAlignVertical: 'top',
  },

  filaOpcion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  textoOpcion: {
    fontSize: 14,
    color: '#475467',
  },

  boton: {
    backgroundColor: '#0f62fe',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  contenedorResultado: {
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },

  etiquetaResultado: {
    fontSize: 14,
    color: '#667085',
  },

  valorResultado: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
    textAlign: 'center',
  },
});