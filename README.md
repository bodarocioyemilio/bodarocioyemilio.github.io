# 💍 bodarocioyemilio.github.io

> **Oye.** Para. Respira.
>
> Sí, tú. El que está leyendo el código fuente de una página de boda.
>
> ¿Todo bien? ¿Estás pasando un buen momento en la vida?

---

## 🚨 Aviso importante para el informático que ha llegado hasta aquí

Mira, esto es una **web de boda**. No hay nada que hackear. No hay API sin autenticar. No hay JWT con `alg: none`. No hay secrets jugosos. Solo hay dos novios muy ilusionados, pétalos flotando en CSS y una cuenta atrás hasta el **12 de septiembre de 2026**.

Si has llegado hasta este repositorio es porque:

- **a)** Eres amigo de Emilio y estás cotilleando el código (esperado, se acepta)
- **b)** Eres el propio Emilio repasando su obra con orgullo paternal (muy probable)
- **c)** Eres un recruiter buscando portafolio (en ese caso: hola, contrata a Emilio)
- **d)** Te has equivocado de repositorio buscando algo importante (aquí no hay nada importante... bueno, para nosotros sí)

---

## ⚙️ Cómo está montado esto (sí, con Claude)

Sí, he tirado de IA. Y qué. Todo el mundo lo hace y el que diga que no miente.

La arquitectura (sí, voy a llamarla así) es la siguiente:

### 🏗️ Stack técnico (aka "lo que usé para no contratar a nadie")

| Tecnología | Por qué | Veredicto |
|---|---|---|
| **HTML / CSS / JS vanilla** | Sin frameworks. Puro músculo. | 💪 Old school pero elegante |
| **GitHub Pages** | Hosting gratis. ¿Qué más quieres? | 🆓 La mejor tarifa |
| **Google Apps Script + Sheets** | Backend del RSVP. Sí, en Google Sheets. | 🤓 Genial o cutre, tú decides |
| **Vimeo Player SDK** | Para el vídeo con control de mute personalizado | 🎬 Clase premium |
| **Claude (Anthropic)** | Co-piloto del desarrollo | 🤖 Sin él habría tardado el doble |

### 🎨 Lo que hace la web (por si te da pereza abrirla)

- **Animación de libro** al cargar: las páginas se abren como... un libro. Muy literario.
- **Parallax del hero** con la iglesia y las vides moviéndose al hacer scroll y al mover el ratón. Sutil, elegante, impresiona a las madres.
- **Pétalos flotantes** en CSS. Porque podíamos y había que hacerlo.
- **Cuenta atrás** en tiempo real hasta el día de la boda. Con segundos. Tictac.
- **Formulario RSVP multistep** de 5 pasos: nombre, asistencia, menú (con alergias), transporte (con parada de autobús) y mensaje a los novios. Todo va a una Google Sheet. Directo, sin intermediarios, sin servidores que mantener.
- **Acordeón de hoteles y transporte** para que los invitados no llamen a las 11 de la noche preguntando dónde dormir.
- **Botón de volver arriba** con detección de Safari iOS porque Apple siempre tiene que ser especial.
- **Scroll reveal** con IntersectionObserver porque las animaciones de entrada no van a hacerse solas.

### 🧠 Detalles de ingeniería que nadie va a apreciar excepto tú

- El hero height está **bloqueado con una CSS custom property** (`--hero-h`) para que en móvil la barra del navegador no provoque un layout reflow al aparecer/desaparecer. Safari, te miro a ti.
- El parallax del ratón usa **LERP** (linear interpolation) con factor 0.07 y un loop de `requestAnimationFrame` que solo corre cuando hay valores que converger. No malgasta ciclos. Es eficiente. Es bonito.
- El scroll está **throttleado con RAF** para no petarle la CPU al abuelo con el Xiaomi de 2019.
- Las imágenes de los hoteles se **precargan en background** después del `window.load` para que cuando el usuario abra el acordeón ya estén en caché. Detalles, baby.
- El formulario tiene un **modo test**: escribe "test" como nombre y simula el envío sin tocar el backend. Muy útil. Muy pro.

---

## 📅 La fecha

**12 de septiembre de 2026.** Rocío & Emilio.

Si has llegado hasta aquí y no eres un invitado... oye, si quieres venir, llama.

---

## 🌐 La web

**[rocioyemilio.es](https://rocioyemilio.es)**

Ahora cierra el inspector de elementos y ve a hacer algo de provecho.

---

*Hecho con 💛, Claude, y demasiadas horas un domingo.*
