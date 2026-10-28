import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Alert, Switch, ScrollView, ActivityIndicator, Image
} from 'react-native';

import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function App() {
  const [mensaje, setMensaje] = useState('');
  const [remitente, setRemitente] = useState('');
  const [esUrgente, setEsUrgente] = useState(false);
  const [esContenidoSensible, setEsContenidoSensible] = useState(false);
  const [limiteProfundidad, setLimiteProfundidad] = useState(3);
  
  const [estadoResultado, setEstadoResultado] = useState('Esperando análisis...');
  const [cargando, setCargando] = useState(false);
  const [datosDFS, setDatosDFS] = useState<any>(null);
  const [graficaPython, setGraficaPython] = useState<string | null>(null);
  const [datosGraficaWeb, setDatosGraficaWeb] = useState<any>(null);
  const [datosAStar, setDatosAStar] = useState<any>(null); 
  const [esSeguro, setEsSeguro] = useState(false);

  // Estados Laboratorio Interactivo
  const [comparativa, setComparativa] = useState<any>(null); 
  const [labInicio, setLabInicio] = useState('A');
  const [labObjetivo, setLabObjetivo] = useState('J');
  const [labAlgoritmo, setLabAlgoritmo] = useState('A* (Heurística)');
  const [labCargando, setLabCargando] = useState(false);
  const [rutaAnimacionLab, setRutaAnimacionLab] = useState<string[]>([]);

  // 1. Análisis de Seguridad
  const evaluarSeguridad = async () => {
    if (mensaje === '' || remitente === '') {
      Alert.alert('Campos vacíos', 'Ingresa el remitente y el contenido.');
      return;
    }

    setCargando(true);

    const tieneEnlace = mensaje.includes('http') || mensaje.includes('.com');
    const remitenteDesconocido = remitente.toLowerCase().includes('desconocido') || remitente.includes('+');

    try {
      // ⚠️ CAMBIA ESTA IP ⚠️
      const response = await fetch('http://192.168.1.92:5000/analizar_avanzado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiene_enlace: tieneEnlace,
          remitente_desconocido: remitenteDesconocido,
          es_urgente: esUrgente,
          es_contenido_sensible: esContenidoSensible,
          limite_profundidad: limiteProfundidad,
          modo_laboratorio: false // Aseguramos que corra el modo normal
        })
      });

      const data = await response.json();

      setEsSeguro(data.es_seguro);
      setEstadoResultado(data.esta_bloqueado ? '⛔ ¡Amenaza Bloqueada!' : '✅ Mensaje Verificado: Seguro');
      setDatosDFS({ orden: data.dfs_orden_exploracion, rutas: data.dfs_rutas_encontradas });
      setGraficaPython(data.grafica_python_base64);
      setDatosGraficaWeb(data.datos_grafica_web);
      setComparativa(data.comparativa_algoritmos);
      
      setDatosAStar({
        rutaOptima: data.astar_ruta_optima,
        costoTotal: data.astar_costo_total,
        nodosExplorados: data.astar_nodos_explorados
      });

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo conectar con el servidor Flask.');
    } finally {
      setCargando(false);
    }
  };

  // 2. Laboratorio Interactivo
  const ejecutarLaboratorio = async () => {
    setLabCargando(true);
    let algClave = 'A*';
    if(labAlgoritmo.includes('BFS')) algClave = 'BFS';
    if(labAlgoritmo.includes('DFS')) algClave = 'DFS';
    if(labAlgoritmo.includes('UCS')) algClave = 'UCS';
    if(labAlgoritmo.includes('Greedy')) algClave = 'Greedy';

    try {
      // ⚠️ CAMBIA ESTA IP ⚠️
      const response = await fetch('http://192.168.1.92:5000/analizar_avanzado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo_laboratorio: true, // Se activa la bandera para probar los algoritmos manuales
          inicio: labInicio, 
          objetivo: labObjetivo, 
          algoritmo: algClave 
        })
      });
      const data = await response.json();
      setComparativa(data.comparativa_algoritmos);
      const letrasRuta = data.ruta_animacion.map((n: string) => extraerLetraNodo(n));
      setRutaAnimacionLab(letrasRuta);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Fallo al procesar el laboratorio.');
    } finally {
      setLabCargando(false);
    }
  };

  const dataBarras = datosGraficaWeb ? {
    labels: datosGraficaWeb.etiquetas,
    datasets: [{
      label: 'Frecuencia de Tipos de Ataque',
      data: datosGraficaWeb.valores,
      backgroundColor: 'rgba(220, 53, 69, 0.8)',
      borderColor: 'rgba(220, 53, 69, 1)',
      borderWidth: 1,
    }]
  } : null;

  const extraerLetraNodo = (nombreNodo: string) => {
    const match = nombreNodo?.match(/\((.*?)\)/);
    return match ? match[1] : (nombreNodo ? nombreNodo.charAt(0) : '');
  };

  const limpiarNombreNodo = (nombreNodo: string) => {
    return nombreNodo ? nombreNodo.replace(/\s*\(.*?\)\s*/g, '') : '';
  };

  // Componente Reutilizable del Grafo (Árbol estático y Rombo)
  const GrafoMatematico = ({ rutaLetras, colorResalte, tipo }: { rutaLetras: string[], colorResalte: string, tipo: 'arbol' | 'rombo' }) => {
    const [pasoAnimacion, setPasoAnimacion] = useState(0);

    useEffect(() => {
      setPasoAnimacion(0); 
      if (!rutaLetras || rutaLetras.length === 0) return;
      let pasoActual = 0;
      const intervalo = setInterval(() => {
        pasoActual++;
        if (pasoActual > rutaLetras.length + 1) pasoActual = 0;
        setPasoAnimacion(pasoActual);
      }, 600);
      return () => clearInterval(intervalo);
    }, [rutaLetras]);

    const esNodoIluminado = (letra: string) => {
      const indice = rutaLetras.indexOf(letra);
      return indice !== -1 && indice < pasoAnimacion;
    };

    const esLineaIluminada = (letraOrigen: string, letraDestino: string) => {
      const idx1 = rutaLetras.indexOf(letraOrigen);
      const idx2 = rutaLetras.indexOf(letraDestino);
      return idx1 !== -1 && idx2 !== -1 && Math.abs(idx1 - idx2) === 1 && Math.max(idx1, idx2) < pasoAnimacion;
    };

    const LineaLienzo = ({ x1, y1, x2, y2, costo, letra1, letra2 }: any) => {
      const dx = x2 - x1; const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const cx = (x1 + x2) / 2; const cy = (y1 + y2) / 2;
      const estaIluminada = esLineaIluminada(letra1, letra2);

      return (
        <View style={{ position: 'absolute', left: 0, top: 0 }}>
          <View style={{ position: 'absolute', left: cx - length / 2, top: cy - (estaIluminada ? 2 : 1), width: length, height: estaIluminada ? 4 : 2, backgroundColor: estaIluminada ? colorResalte : '#cbd5e1', transform: [{ rotate: `${angle}deg` }], elevation: estaIluminada ? 2 : 0 }} />
          <Text style={{ position: 'absolute', left: cx - 6, top: cy - 16, color: '#e63946', fontWeight: 'bold', fontSize: 12, backgroundColor: 'rgba(255, 255, 255, 0.8)', paddingHorizontal: 2, borderRadius: 4, overflow: 'hidden' }}>{costo}</Text>
        </View>
      );
    };

    const NodoLienzo = ({ letra, x, y, hJ }: any) => {
      const estaIluminado = esNodoIluminado(letra);
      
      let bgNode = estaIluminado ? colorResalte : (letra === 'A' ? '#1e3a8a' : '#475569');
      let borderNode = estaIluminado ? '#ffffff' : '#bfdbfe';

      if (tipo === 'rombo' && !estaIluminado) {
        bgNode = '#94a3b8'; borderNode = '#334155';
        if (letra === 'A') bgNode = '#22c55e';
        else if (letra === 'J') bgNode = '#ef4444';
        else if (letra === 'B' || letra === 'D') bgNode = '#fcd34d';
        else bgNode = '#93c5fd';
      }

      return (
        <View style={{ position: 'absolute', left: x - 15, top: y - 15, width: 30, height: 30, borderRadius: 15, backgroundColor: bgNode, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: borderNode, elevation: 3 }}>
          <Text style={{ color: tipo === 'rombo' && !estaIluminado ? '#1e293b' : '#ffffff', fontWeight: 'bold', fontSize: 14 }}>{letra}</Text>
          {tipo === 'rombo' && <Text style={{ position: 'absolute', top: 32, fontSize: 10, color: '#475569' }}>hJ={hJ}</Text>}
        </View>
      );
    };

    const coordsArbol = {
      A: { x: 100, y: 20 }, B: { x: 50, y: 80 }, C: { x: 150, y: 80 },
      D: { x: 20, y: 140 }, E: { x: 80, y: 140 }, F: { x: 120, y: 140 }, G: { x: 180, y: 140 },
      H: { x: 20, y: 200 }, I: { x: 80, y: 200 }, J: { x: 120, y: 200 }
    };

    const coordsRombo = {
      A: { x: 150, y: 30, h: 9 }, B: { x: 80,  y: 100, h: 8 }, C: { x: 220, y: 100, h: 5 },
      D: { x: 30,  y: 170, h: 6 }, E: { x: 130, y: 170, h: 5 }, F: { x: 170, y: 170, h: 4 }, G: { x: 270, y: 170, h: 3 },
      H: { x: 80,  y: 240, h: 5 }, I: { x: 220, y: 240, h: 2 }, J: { x: 150, y: 310, h: 0 }
    };

    const coords = tipo === 'arbol' ? coordsArbol : coordsRombo;

    return (
      <View style={{ alignItems: 'center', width: '100%', paddingTop: 10 }}>
        {tipo === 'arbol' && <Text style={estilos.tituloArbol}>Grafo de Análisis Completo</Text>}
        <View style={{ width: tipo === 'arbol' ? 200 : 300, height: tipo === 'arbol' ? 220 : 350, position: 'relative', marginTop: 10 }}>
          <LineaLienzo x1={coords.A.x} y1={coords.A.y} x2={coords.B.x} y2={coords.B.y} costo="2" letra1="A" letra2="B" />
          <LineaLienzo x1={coords.A.x} y1={coords.A.y} x2={coords.C.x} y2={coords.C.y} costo="5" letra1="A" letra2="C" />
          <LineaLienzo x1={coords.B.x} y1={coords.B.y} x2={coords.D.x} y2={coords.D.y} costo="4" letra1="B" letra2="D" />
          <LineaLienzo x1={coords.B.x} y1={coords.B.y} x2={coords.E.x} y2={coords.E.y} costo={tipo === 'rombo' ? "7" : "1"} letra1="B" letra2="E" />
          <LineaLienzo x1={coords.C.x} y1={coords.C.y} x2={coords.F.x} y2={coords.F.y} costo="2" letra1="C" letra2="F" />
          <LineaLienzo x1={coords.C.x} y1={coords.C.y} x2={coords.G.x} y2={coords.G.y} costo={tipo === 'rombo' ? "6" : "8"} letra1="C" letra2="G" />
          <LineaLienzo x1={coords.D.x} y1={coords.D.y} x2={coords.H.x} y2={coords.H.y} costo="3" letra1="D" letra2="H" />
          <LineaLienzo x1={coords.E.x} y1={coords.E.y} x2={tipo === 'rombo' ? coords.H.x : coords.I.x} y2={tipo === 'rombo' ? coords.H.y : coords.I.y} costo="2" letra1="E" letra2={tipo === 'rombo' ? "H" : "I"} />
          <LineaLienzo x1={coords.F.x} y1={coords.F.y} x2={tipo === 'rombo' ? coords.I.x : coords.J.x} y2={tipo === 'rombo' ? coords.I.y : coords.J.y} costo="3" letra1="F" letra2={tipo === 'rombo' ? "I" : "J"} />
          {tipo === 'rombo' && <LineaLienzo x1={coords.G.x} y1={coords.G.y} x2={coords.I.x} y2={coords.I.y} costo="2" letra1="G" letra2="I" />}
          {tipo === 'rombo' && <LineaLienzo x1={coords.H.x} y1={coords.H.y} x2={coords.J.x} y2={coords.J.y} costo="5" letra1="H" letra2="J" />}
          {tipo === 'rombo' && <LineaLienzo x1={coords.I.x} y1={coords.I.y} x2={coords.J.x} y2={coords.J.y} costo="2" letra1="I" letra2="J" />}
          
          {Object.entries(coords).map(([letra, data]: any) => (
            <NodoLienzo key={letra} letra={letra} x={data.x} y={data.y} hJ={data.h} />
          ))}
        </View>
      </View>
    );
  };

  const BotonSelector = ({ titulo, opciones, seleccionado, onSelect }: any) => (
    <View style={{ flex: 1, marginHorizontal: 2 }}>
      <Text style={estilos.labelFiltro}>{titulo}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
        {opciones.map((opcion: string) => (
          <TouchableOpacity 
            key={opcion} onPress={() => onSelect(opcion)}
            style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: seleccionado === opcion ? '#0f62fe' : '#f1f5f9', borderRadius: 6, marginRight: 5, borderWidth: 1, borderColor: seleccionado === opcion ? '#0f62fe' : '#cbd5e1' }}
          >
            <Text style={{ color: seleccionado === opcion ? '#ffffff' : '#334155', fontSize: 12, fontWeight: seleccionado === opcion ? 'bold' : 'normal' }}>{opcion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView style={estilos.contenedor}>
      <View style={estilos.encabezado}>
        <Text style={estilos.tituloEncabezado}>SafeGuard IA</Text>
        <Text style={estilos.subtituloEncabezado}>Panel de Inteligencia Artificial</Text>
      </View>

      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>Remitente:</Text>
        <TextInput style={estilos.entradaTexto} placeholder="Ej: desconocido@gmail.com" value={remitente} onChangeText={setRemitente} autoCapitalize="none" />
        <Text style={estilos.etiqueta}>Mensaje recibido:</Text>
        <TextInput style={[estilos.entradaTexto, estilos.areaTexto]} placeholder="Escribe el mensaje con enlace..." value={mensaje} onChangeText={setMensaje} multiline />
        
        <View style={estilos.filaOpcion}>
          <Text style={estilos.textoOpcion}>¿Tono de urgencia?</Text>
          <Switch value={esUrgente} onValueChange={setEsUrgente} />
        </View>
        <View style={estilos.filaOpcion}>
          <Text style={estilos.textoOpcion}>¿Imagen sensible?</Text>
          <Switch value={esContenidoSensible} onValueChange={setEsContenidoSensible} />
        </View>

        <View style={estilos.filaOpcion}>
          <Text style={estilos.textoOpcion}>Límite de Profundidad (DFS):</Text>
          <View style={estilos.stepper}>
            <TouchableOpacity style={estilos.stepperBoton} onPress={() => setLimiteProfundidad(Math.max(1, limiteProfundidad - 1))}>
              <Text style={estilos.stepperTexto}>-</Text>
            </TouchableOpacity>
            <Text style={estilos.stepperValor}>{limiteProfundidad}</Text>
            <TouchableOpacity style={estilos.stepperBoton} onPress={() => setLimiteProfundidad(Math.min(6, limiteProfundidad + 1))}>
              <Text style={estilos.stepperTexto}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={estilos.boton} onPress={evaluarSeguridad}>
          <Text style={estilos.textoBoton}>Analizar con IA</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.contenedorResultado}>
        <Text style={estilos.etiquetaResultado}>Dictamen Lógico:</Text>
        {cargando ? <ActivityIndicator size="large" color="#0f62fe" /> : <Text style={estilos.valorResultado}>{estadoResultado}</Text>}
      </View>

      {datosDFS && datosDFS.orden && datosDFS.orden.length > 0 && (
        <View style={estilos.tarjetaAzul}>
          <Text style={estilos.tituloSeccion}>📍 Trazabilidad DFS (Redirecciones)</Text>
          <Text style={estilos.subtituloSeccion}>Orden de Exploración de Nodos:</Text>
          <Text style={estilos.textoNormal}>{datosDFS.orden.join(' ➔ ')}</Text>
          
          <Text style={estilos.subtituloSeccion}>Rutas Hacia Servidor Malicioso ({datosDFS.rutas.length}):</Text>
          {datosDFS.rutas.length > 0 ? (
            datosDFS.rutas.map((ruta: any, index: number) => (
              <Text key={index} style={estilos.textoRutaRoja}>Ruta {index + 1}: {ruta.join(' ➔ ')}</Text>
            ))
          ) : (
            <Text style={{ color: '#d90429', marginTop: 10 }}>❌ El límite de {limiteProfundidad} no fue suficiente.</Text>
          )}
          <Text style={estilos.notaPie}>* Límite de profundidad actual: {limiteProfundidad}</Text>
        </View>
      )}

      {datosAStar && datosAStar.rutaOptima && (
        <View style={estilos.tarjetaVerde}>
          <Text style={estilos.tituloSeccion}>⭐ Optimización de Análisis (A* con Heurística)</Text>
          <Text style={estilos.notaDescriptiva}>
            La IA trazó dinámicamente esta ruta óptima para llegar a su dictamen, evaluando el costo de procesamiento g(n).
          </Text>

          <View style={estilos.cajaResaltadaDoble}>
            <View style={estilos.mitadIzquierda}>
               <GrafoMatematico tipo="arbol" rutaLetras={datosAStar.rutaOptima.map(extraerLetraNodo)} colorResalte={esSeguro ? '#0284c7' : '#166534'} />
            </View>

            <View style={estilos.mitadDerecha}>
              <Text style={estilos.etiquetaResaltada}>Ruta Dinámica Elegida:</Text>
              
              <View style={estilos.contenedorGrafoRuta}>
                {datosAStar.rutaOptima.map((nodo: string, index: number) => (
                  <View key={index} style={estilos.nodoGrafoContainer}>
                    <View style={[estilos.circuloNodoVertical, { backgroundColor: esSeguro ? '#0284c7' : '#166534', borderColor: esSeguro ? '#bae6fd' : '#bbf7d0' }]}>
                      <Text style={estilos.textoCirculoVertical}>{extraerLetraNodo(nodo)}</Text>
                    </View>
                    <Text style={[estilos.etiquetaNodoVertical, { color: esSeguro ? '#0369a1' : '#15803d' }]}>{limpiarNombreNodo(nodo)}</Text>
                    
                    {index < datosAStar.rutaOptima.length - 1 && (
                      <View style={estilos.flechaContainerVertical}>
                        <View style={[estilos.lineaFlechaVertical, { backgroundColor: esSeguro ? '#0369a1' : '#15803d' }]} />
                        <Text style={[estilos.cabezaFlechaVertical, { color: esSeguro ? '#0369a1' : '#15803d' }]}>▼</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              <Text style={estilos.costoTotal}>Costo Total Real g(n): {datosAStar.costoTotal} ms</Text>
            </View>
          </View>

          <Text style={estilos.subtituloSeccion}>Desglose de Nodos Explorados:</Text>
          {datosAStar.nodosExplorados.map((nodo: any, index: number) => (
            <View key={index} style={estilos.filaExploracion}>
              <Text style={estilos.textoNodoEx}>{nodo.nodo}</Text>
              <Text style={estilos.textoCosto}>g: {nodo.gn} | h: {nodo.hn} | f: {nodo.fn}</Text>
            </View>
          ))}
        </View>
      )}

      {/* SECCIÓN DEL LABORATORIO DE ALGORITMOS (Integrado en el diseño limpio) */}
      {comparativa && comparativa.length > 0 && (
        <View style={estilos.tarjetaBlanca}>
          <Text style={estilos.tituloSeccion}>🔬 Laboratorio: Comparativa de Algoritmos</Text>
          <Text style={estilos.notaDescriptiva}>
            Comparación de rendimiento entre los diferentes métodos de búsqueda ejecutados en el servidor sobre el mismo grafo de análisis.
          </Text>

          <View style={estilos.tablaCabecera}>
            <Text style={[estilos.celdaCabecera, { flex: 1.5 }]}>Algoritmo</Text>
            <Text style={[estilos.celdaCabecera, { flex: 2 }]}>Ruta Encontrada</Text>
            <Text style={[estilos.celdaCabecera, { flex: 1, textAlign: 'center' }]}>Costo</Text>
          </View>

          {comparativa.map((item: any, index: number) => (
            <View key={index} style={estilos.filaTabla}>
              <Text style={[estilos.celdaTexto, { flex: 1.5, fontWeight: 'bold', color: item.algoritmo.includes(labAlgoritmo.split(' ')[0]) ? '#8b5cf6' : '#1e293b' }]}>
                {item.algoritmo}
              </Text>
              <Text style={[estilos.celdaTexto, { flex: 2, color: '#475569' }]}>
                {item.ruta.length > 0 ? item.ruta.map(extraerLetraNodo).join(' ➔ ') : 'Sin ruta'}
              </Text>
              <Text style={[estilos.celdaTexto, { flex: 1, textAlign: 'center', color: '#b91c1c', fontWeight: 'bold' }]}>
                {item.ruta.length > 0 ? `${item.costo} ms` : '-'}
              </Text>
            </View>
          ))}

          <View style={estilos.separador} />
          <Text style={estilos.subtituloGrafica}>Grafo Interactivo de Algoritmos</Text>
          
          <View style={{ marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              <BotonSelector titulo="Nodo Inicio:" opciones={['A','B','C','D','E','F','G','H','I','J']} seleccionado={labInicio} onSelect={setLabInicio} />
              <BotonSelector titulo="Nodo Objetivo:" opciones={['A','B','C','D','E','F','G','H','I','J']} seleccionado={labObjetivo} onSelect={setLabObjetivo} />
            </View>
            <BotonSelector titulo="Algoritmo a Visualizar:" opciones={['BFS (Anchura)', 'DFS (Profundidad)', 'UCS (Costo Uniforme)', 'Greedy (Voraz)', 'A* (Heurística)']} seleccionado={labAlgoritmo} onSelect={setLabAlgoritmo} />
            
            <TouchableOpacity style={[estilos.boton, {backgroundColor: '#8b5cf6', marginTop: 15}]} onPress={ejecutarLaboratorio}>
              {labCargando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.textoBoton}>▶ Animar Ruta en el Grafo</Text>}
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
             <GrafoMatematico tipo="rombo" rutaLetras={rutaAnimacionLab} colorResalte="#8b5cf6" />
          </View>
        </View>
      )}

      {/* GRÁFICAS */}
      {(graficaPython || datosGraficaWeb) && (
        <View style={estilos.tarjetaBlanca}>
          <Text style={estilos.tituloSeccion}>📊 Reportes de Seguridad</Text>
          {graficaPython && (
            <View style={estilos.seccionInterna}>
              <Text style={estilos.subtituloGrafica}>1. Renderizado Estático (Matplotlib backend)</Text>
              <Image source={{ uri: `data:image/png;base64,${graficaPython}` }} style={estilos.imagenGrafica} />
            </View>
          )}
          <View style={estilos.separador} />
          {dataBarras && (
            <View style={estilos.seccionInterna}>
              <Text style={estilos.subtituloGrafica}>2. Renderizado Interactivo (React Web)</Text>
              <View style={estilos.contenedorGraficoWeb}>
                <Bar data={dataBarras} options={{ responsive: true, maintainAspectRatio: false }} />
              </View>
            </View>
          )}
        </View>
      )}
      
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f2f4f7' },
  encabezado: { backgroundColor: '#1a1f2c', padding: 20, paddingTop: 50, alignItems: 'center' },
  tituloEncabezado: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  subtituloEncabezado: { color: '#9aa5b5', fontSize: 14, marginTop: 4 },
  tarjeta: { backgroundColor: '#ffffff', margin: 16, padding: 20, borderRadius: 12, elevation: 3 },
  etiqueta: { fontSize: 15, fontWeight: 'bold', color: '#333333', marginBottom: 6 },
  entradaTexto: { borderWidth: 1, borderColor: '#d0d5dd', borderRadius: 8, padding: 10, marginBottom: 14, backgroundColor: '#fafafa' },
  areaTexto: { height: 80, textAlignVertical: 'top' },
  filaOpcion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  textoOpcion: { fontSize: 14, color: '#475467', fontWeight: 'bold' },
  boton: { backgroundColor: '#0f62fe', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  textoBoton: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  contenedorResultado: { alignItems: 'center', marginHorizontal: 16, padding: 16, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#d0d5dd' },
  etiquetaResultado: { fontSize: 14, color: '#667085' },
  valorResultado: { fontSize: 18, fontWeight: 'bold', marginTop: 6, textAlign: 'center', color: '#d90429' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f4f7', borderRadius: 8, borderWidth: 1, borderColor: '#d0d5dd' },
  stepperBoton: { paddingHorizontal: 15, paddingVertical: 5, backgroundColor: '#e2e8f0', borderRadius: 8 },
  stepperTexto: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  stepperValor: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 15, color: '#0f62fe' },
  
  tarjetaAzul: { backgroundColor: '#eef2f6', margin: 16, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#cdd5df' },
  tarjetaBlanca: { backgroundColor: '#ffffff', margin: 16, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#cdd5df', elevation: 2 },
  tarjetaVerde: { backgroundColor: '#f0fdf4', margin: 16, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  
  tituloSeccion: { fontSize: 18, fontWeight: 'bold', color: '#1a1f2c', marginBottom: 10 },
  subtituloSeccion: { fontSize: 14, fontWeight: 'bold', color: '#475467', marginTop: 10 },
  textoNormal: { fontSize: 14, color: '#0f62fe', marginTop: 6 },
  textoRutaRoja: { fontSize: 14, color: '#e63946', marginTop: 6, fontWeight: 'bold' },
  notaPie: { fontSize: 12, color: '#9aa5b5', marginTop: 15, fontStyle: 'italic', fontWeight: 'bold' },
  seccionInterna: { alignItems: 'center', marginVertical: 10 },
  subtituloGrafica: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  imagenGrafica: { width: '100%', height: 250, resizeMode: 'contain' },
  contenedorGraficoWeb: { height: 300, width: '100%' },
  separador: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 25 },
  notaDescriptiva: { fontSize: 13, color: '#475467', marginBottom: 15 },
  
  cajaResaltadaDoble: { flexDirection: 'row', backgroundColor: '#ffffff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#86efac', marginBottom: 15 },
  mitadIzquierda: { flex: 1, borderRightWidth: 1, borderRightColor: '#dcfce7', alignItems: 'center' },
  mitadDerecha: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  etiquetaResaltada: { fontSize: 14, fontWeight: 'bold', color: '#166534', marginBottom: 20, textAlign: 'center' },
  costoTotal: { fontSize: 16, fontWeight: 'bold', color: '#b91c1c', marginTop: 20, textAlign: 'center' },
  filaExploracion: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#dcfce7', paddingVertical: 8 },
  textoNodoEx: { fontSize: 12, color: '#374151', flex: 1 },
  textoCosto: { fontSize: 12, fontWeight: 'bold', color: '#059669' },

  contenedorGrafoRuta: { alignItems: 'center', width: '100%' },
  nodoGrafoContainer: { alignItems: 'center', marginVertical: 5 },
  circuloNodoVertical: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, elevation: 3 },
  textoCirculoVertical: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  etiquetaNodoVertical: { fontSize: 13, fontWeight: 'bold', marginTop: 5, textAlign: 'center' },
  flechaContainerVertical: { alignItems: 'center', marginVertical: 5 },
  lineaFlechaVertical: { width: 2, height: 15 }, 
  cabezaFlechaVertical: { fontSize: 14, marginTop: -5 }, 
  tituloArbol: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 5 },

  tablaCabecera: { flexDirection: 'row', backgroundColor: '#e2e8f0', padding: 10, borderRadius: 6, marginBottom: 5 },
  celdaCabecera: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  filaTabla: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 10, paddingHorizontal: 5 },
  celdaTexto: { fontSize: 12 },
  labelFiltro: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5 }
});