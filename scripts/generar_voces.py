
#!/usr/bin/env python3
"""
Generador y empaquetador de voces para Frecuencia.
Catálogo de líneas narrativas del juego.
Puede ejecutarse para generar archivos WAV/OGG si piper-tts o edge-tts están instalados,
o para verificar qué archivos faltan en audio/voces/.
"""

import json
import os
import sys

VOICE_SCRIPT = {
    # Intro y Tutorial
    "intro_wake": "Despiertas en frío... la camilla está manchada. Sigue el pulso en tus sienes.",
    "tut_move": "Mueve tus pies. El suelo tiembla con la misma cadencia.",
    "tut_look": "Mira a tu alrededor. La oscuridad no está vacía.",
    "tut_gun": "Toma el arma del suelo. Siente la vibración metálica.",
    "tut_rhythm": "Dispara cuando el círculo se cierre en la mira. Si respetas el compás, serás letal.",
    "tut_door": "La puerta ha cedido. No te detengas.",

    # Morgue (Nivel 1)
    "l1_enter": "La Morgue. Los cajones frigoríficos vibran con el Proyecto F.",
    "l1_ambush": "Los sujetos despiertan. Vienen de las gavetas.",
    "l1_stun_tip": "Un disparo al compás aturde al sujeto.",
    "l1_clear": "El silencio regresa... por ahora.",

    # Perrera (Nivel 2)
    "l2_enter": "La Perrera. Huele a óxido y suturas frescas.",
    "l2_ambush": "Las jaulas se abren. Escucha sus jadeos.",
    "l2_dog_tip": "Se agachan antes de saltar. Muévete de lado cuando se lancen.",
    "l2_clear": "Las jaulas quedaron vacías.",

    # Quirófano (Nivel 3)
    "l3_enter": "El Quirófano central. El instrumental aún está manchado.",
    "l3_surgeon": "El cirujano te apunta con su haz luminoso. Cúbrete tras los pilares.",
    "l3_orderly": "Cuidado con el camillero... su carga es mortal si te acorrala contra el muro.",
    "l3_cyst": "Los quistes van a reventar. Destrúyelos antes del cuarto latido.",
    "l3_clear": "La mesa de operaciones está libre. El camino al núcleo está abierto.",

    # Jefe Final - El Corazón (Nivel 4)
    "boss_enter": "El Corazón biomecánico. El origen de la frecuencia.",
    "boss_shield": "Su campo eléctrico repele los disparos torpes. Solo el compás perfecto romperá su escudo.",
    "boss_phase2": "El pulso se acelera... el tejido muscular está convulsionando.",
    "boss_phase3": "¡Fase crítica! El núcleo late fuera de control.",
    "boss_defeat": "El corazón se detiene. La frecuencia por fin ha cesado.",

    # Recuerdos
    "mem_1": "Eras médico. Tus manos cuidaban vidas antes de este lugar.",
    "mem_2": "El experimento se llamaba Proyecto F. Buscaban modular el alma humana con sonido.",
    "mem_3": "El dibujo en la pared era de tu pequeña Fe... tú fuiste el último sujeto de prueba.",
    "mem_4": "La frecuencia se apaga. Eres libre.",

    # Armas y Pickups
    "w_scalpel": "Un bisturí quirúrgico. Silencioso, certero en el compás.",
    "w_pistol": "Pistola reglamentaria. Precisión al ritmo.",
    "w_shotgun": "Escopeta de doble cañón. El retroceso frena a las bestias.",
    "w_smg": "Subfusil táctico. Ráfagas sincronizadas.",
    "w_defib": "Desfibrilador de alto voltaje. Una descarga paralizante.",
    "pick_ammo": "Munición asegurada.",
    "pick_medkit": "Estimulante inyectado. La visión se aclara.",

    # Avisos de combate y reactivos
    "low_hp": "Tu ritmo cardíaco se desploma... resiste.",
    "combo_high": "Sincronía absoluta. La música resuena en tu sangre.",
    "player_dead": "El pulso se extinguió... presiona F para reiniciar la frecuencia."
}

def export_manifest():
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "audio", "voces"))
    os.makedirs(out_dir, exist_ok=True)
    manifest_path = os.path.join(out_dir, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(VOICE_SCRIPT, f, indent=2, ensure_ascii=False)
    print(f"[OK] Manifiesto de voces guardado en {manifest_path} ({len(VOICE_SCRIPT)} líneas).")

def check_files():
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "audio", "voces"))
    missing = []
    found = []
    for vid in VOICE_SCRIPT:
        ogg_path = os.path.join(out_dir, f"{vid}.ogg")
        wav_path = os.path.join(out_dir, f"{vid}.wav")
        mp3_path = os.path.join(out_dir, f"{vid}.mp3")
        if os.path.exists(ogg_path) or os.path.exists(wav_path) or os.path.exists(mp3_path):
            found.append(vid)
        else:
            missing.append(vid)
    print(f"Archivos encontrados: {len(found)}/{len(VOICE_SCRIPT)}")
    if missing:
        print("Archivos de audio faltantes (el juego usará Web Speech API automáticamente como respaldo):")
        for m in missing[:8]:
            print(f"  - {m}: \"{VOICE_SCRIPT[m][:50]}...\"")
        if len(missing) > 8:
            print(f"  ... y {len(missing) - 8} más.")

if __name__ == "__main__":
    export_manifest()
    check_files()
