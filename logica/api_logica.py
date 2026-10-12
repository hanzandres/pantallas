from flask import Flask, request, jsonify
servidor = Flask(__name__)
@servidor.route('/analizar', methods=['POST'])

def evaluar_logica():
    datos = request.json or {}
    
    #propocisiones logicas 
    p = datos.get('tiene_enlace', False)
    q = datos.get('remitente_desconocido', False)
    r = datos.get('es_urgente', False)
    d = datos.get('es_contenido_sensible', False)


    #operadores logicos 
    resultado_phishing = p and (q or r)
    resultado_bloqueo = resultado_phishing or d
    resultado_seguro = not resultado_bloqueo

    return jsonify({
        "es_phishing": resultado_phishing,
        "esta_bloqueado": resultado_bloqueo,
        "es_seguro": resultado_seguro
    })

if __name__ == '__main__':
    servidor.run(debug=True, host='0.0.0.0', port=5000)